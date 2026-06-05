import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { QueryRunner, SelectQueryBuilder } from "typeorm";

import { SortOrderEnum } from "src/constants/common.constants";
import { DatabaseService } from "src/modules/database/database.service";
import { RazorpayService } from "src/modules/payments/razorpay.service";
import { RedisService } from "src/modules/redis/redis.service";
import { applyPagination } from "src/utils/helper.utils";
import { createPaginationMeta } from "src/utils/pagination.utils";

import { ListOrdersDto } from "../dto/list-orders.dto";
import { UpdateVendorOrderStatusDto } from "../dto/udpate-vendor-order-status.dto";
import { OrderEntity } from "../entities/order.entity";
import { VendorOrderEntity } from "../entities/vendor-order.entity";
import {
  getOrderDetailsCacheKey,
  getOrderListCacheKey,
  buildOrderDetailsResponse,
  buildOrderListResponse,
  validateVendorOrderStatusTransition,
  invalidateCache,
} from "../order.utils";
import { ERROR_MESSAGES, ORDER_CACHE_TTL, ORDER_ERROR_CONTEXT, ORDER_SELECT_FIELDS } from "../orders.constants";
import {
  OrderSortByEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  VendorOrderStatusEnum,
} from "../orders.enums";
import { OrderWithAddress, VendorOrderWithVendor } from "../orders.interface";
import { OrderDetailsResponse } from "../responses/order-details.response";
import { OrdersListResponse } from "../responses/order-list.response";

@Injectable()
export class OrderService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly razorpayService: RazorpayService,
  ) {}

  async getMyOrders(userId: string, query: ListOrdersDto): Promise<OrdersListResponse> {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = OrderSortByEnum.CREATED_AT,
      sortOrder = SortOrderEnum.DESC,
      status,
      paymentStatus,
      paymentMethod,
      isPagination = true,
    } = query;

    if (!Object.values(OrderSortByEnum).includes(sortBy)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_SORT_FIELD);
    }

    const cacheParams = [
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
      paymentStatus,
      paymentMethod,
      isPagination,
    ].join("-");

    const cacheKey = getOrderListCacheKey(userId, cacheParams);

    return this.redisService.getOrSet({
      key: cacheKey,
      ttl: ORDER_CACHE_TTL,
      fetcher: () => {
        const qb = this.databaseService
          .getRepository(OrderEntity)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.address", "address")
          .select(ORDER_SELECT_FIELDS.ORDER_FOR_USER);

        this.applyOrderFilters({
          qb,
          userId,
          search,
          status,
          paymentStatus,
          paymentMethod,
        });

        qb.orderBy(`order.${sortBy}`, sortOrder);

        return this.getOrderListResponse({
          qb,
          page,
          limit,
          isPagination,
        });
      },
    });
  }

  async getOrderDetails(orderId: string, userId: string): Promise<OrderDetailsResponse> {
    return this.redisService.getOrSet({
      key: getOrderDetailsCacheKey(orderId),
      ttl: ORDER_CACHE_TTL,
      fetcher: async () => this.findOrderDetails(orderId, userId),
    });
  }

  private async findOrderDetails(orderId: string, userId: string): Promise<OrderDetailsResponse> {
    const order = await this.databaseService
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .leftJoin("order.address", "address")
      .select(ORDER_SELECT_FIELDS.ORDER_FOR_USER_DETAILS)
      .where("order.id = :orderId AND order.userId = :userId ", { orderId, userId })
      .getOne();

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const vendorOrders = await this.databaseService
      .getRepository(VendorOrderEntity)
      .createQueryBuilder("vendorOrder")
      .leftJoin("vendorOrder.vendor", "vendor")
      .leftJoinAndSelect("vendorOrder.orderItems", "orderItem")
      .select([...ORDER_SELECT_FIELDS.VENDOR_ORDER_FOR_DETAILS, ...ORDER_SELECT_FIELDS.ORDER_ITEM_FOR_DETAILS])
      .where("vendorOrder.orderId = :orderId", { orderId })
      .getMany();

    return buildOrderDetailsResponse(order as OrderWithAddress, vendorOrders as VendorOrderWithVendor[]);
  }

  private applyOrderFilters({
    qb,
    userId,
    search,
    status,
    paymentStatus,
    paymentMethod,
  }: {
    qb: SelectQueryBuilder<OrderEntity>;
    userId: string;
    search?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
  }): void {
    qb.where("order.userId = :userId", { userId });

    if (search) {
      qb.andWhere("order.orderNumber ILIKE :search", {
        search: `%${search}%`,
      });
    }

    if (status) {
      qb.andWhere("order.status = :status", { status });
    }

    if (paymentStatus) {
      qb.andWhere("order.paymentStatus = :paymentStatus", { paymentStatus });
    }

    if (paymentMethod) {
      qb.andWhere("order.paymentMethod = :paymentMethod", { paymentMethod });
    }
  }

  private async getOrderListResponse({
    qb,
    page,
    limit,
    isPagination,
  }: {
    qb: SelectQueryBuilder<OrderEntity>;
    page: number;
    limit: number;
    isPagination: boolean;
  }): Promise<OrdersListResponse> {
    if (isPagination) {
      applyPagination(qb, {
        page,
        limit,
        isPagination,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: buildOrderListResponse(data as OrderWithAddress[]),
      ...(isPagination && {
        meta: createPaginationMeta(page, limit, total),
      }),
    };
  }

  async updateVendorOrderStatus(
    vendorId: string | null,
    vendorOrderId: string,
    dto: UpdateVendorOrderStatusDto,
  ): Promise<void> {
    const [orderId, userId] = await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        if (!vendorId) {
          throw new ForbiddenException();
        }
        const vendorOrderRepo = queryRunner.manager.getRepository(VendorOrderEntity);

        const vendorOrder = await vendorOrderRepo
          .createQueryBuilder("vendorOrder")
          .leftJoinAndSelect("vendorOrder.order", "order")
          .select([...ORDER_SELECT_FIELDS.VENDOR_ORDER, ...ORDER_SELECT_FIELDS.ORDER_FOR_PAYMENT])
          .where(`vendorOrder.id = :vendorOrderId AND vendorOrder.vendorId = :vendorId`, { vendorOrderId, vendorId })
          .getOne();

        if (!vendorOrder) {
          throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
        }

        const isOnlinePayment = vendorOrder.order.paymentMethod === PaymentMethodEnum.RAZORPAY;

        if (isOnlinePayment && vendorOrder.order.paymentStatus !== PaymentStatusEnum.PAID) {
          throw new BadRequestException(ERROR_MESSAGES.ORDER_PAYMENT_PENDING);
        }

        validateVendorOrderStatusTransition(vendorOrder.status, dto.status);

        if (isOnlinePayment && dto.status === VendorOrderStatusEnum.CANCELLED) {
          await this.razorpayService.refundPayment(vendorOrder.order.razorpayPaymentId!);
          const { id } = vendorOrder.order;

          await queryRunner.manager.update(
            OrderEntity,
            { id },
            {
              paymentStatus: PaymentStatusEnum.REFUNDED,
              status: OrderStatusEnum.CANCELLED,
            },
          );
        }
        vendorOrder.status = dto.status;
        await vendorOrderRepo.save(vendorOrder);
        return [vendorOrder.order.id, vendorOrder.order.userId];
      },
      errorContext: ORDER_ERROR_CONTEXT.UPDATE_ORDER_STATUS,
    });
    await invalidateCache(this.redisService, orderId, userId);
  }
}
