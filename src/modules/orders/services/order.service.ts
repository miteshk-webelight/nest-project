import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { QueryRunner, SelectQueryBuilder } from "typeorm";

import { SortOrderEnum } from "src/constants/common.constants";
import { DatabaseService } from "src/modules/database/database.service";
import { RazorpayService } from "src/modules/payments/razorpay.service";
import { ProductEntity } from "src/modules/products/product.entity";
import { RedisService } from "src/modules/redis/redis.service";
import { UsersEntity } from "src/modules/users/entity/users.entity";
import { UserRoleEnum } from "src/modules/users/user.constants";
import { VendorProfileEntity } from "src/modules/vendors/vendor.profile.entity";
import { applyPagination } from "src/utils/helper.utils";
import { createPaginationMeta } from "src/utils/pagination.utils";

import { OrderEvents } from "../constants/order-events";
import { ListOrdersDto } from "../dto/list-orders.dto";
import { UpdateVendorOrderStatusDto } from "../dto/udpate-vendor-order-status.dto";
import { OrderItemEntity } from "../entities/order-item.entity";
import { OrderEntity } from "../entities/order.entity";
import { VendorOrderEntity } from "../entities/vendor-order.entity";
import {
  getOrderAccessScopeKey,
  getOrderDetailsCacheKey,
  getOrderListCacheKey,
  buildAdminOrderDetailsResponse,
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
import { OrderAccessContext } from "../orders.interface";
import { AdminOrderDetailsResponse, OrderDetailsResponse } from "../responses/order-details.response";
import { OrdersListResponse } from "../responses/order-list.response";

@Injectable()
export class OrderService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly razorpayService: RazorpayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMyOrders(access: OrderAccessContext, query: ListOrdersDto): Promise<OrdersListResponse> {
    this.validateOrderAccess(access);

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

    const scopeKey = getOrderAccessScopeKey(access);
    const cacheKey = getOrderListCacheKey(scopeKey, cacheParams);

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
          access,
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

  async getOrderDetails(
    orderId: string,
    access: OrderAccessContext,
  ): Promise<OrderDetailsResponse | AdminOrderDetailsResponse> {
    this.validateOrderAccess(access);

    const scopeKey = getOrderAccessScopeKey(access);

    return this.redisService.getOrSet({
      key: getOrderDetailsCacheKey(orderId, scopeKey),
      ttl: ORDER_CACHE_TTL,
      fetcher: async () => this.findOrderDetails(orderId, access),
    });
  }

  private validateOrderAccess(access: OrderAccessContext): void {
    if (access.role === UserRoleEnum.VENDOR && !access.vendorId) {
      throw new ForbiddenException(ERROR_MESSAGES.VENDOR_NOT_APPROVED);
    }
  }

  private async findOrderDetails(
    orderId: string,
    access: OrderAccessContext,
  ): Promise<OrderDetailsResponse | AdminOrderDetailsResponse> {
    const isAdmin = access.role === UserRoleEnum.ADMIN;

    const orderQb = this.databaseService
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .leftJoin("order.address", "address")
      .select(
        isAdmin
          ? [...ORDER_SELECT_FIELDS.ORDER_FOR_ADMIN_DETAILS, ...ORDER_SELECT_FIELDS.ORDER_USER_FOR_ADMIN_DETAILS]
          : ORDER_SELECT_FIELDS.ORDER_FOR_USER_DETAILS,
      )
      .where("order.id = :orderId", { orderId });

    if (isAdmin) {
      orderQb.leftJoin("order.user", "user");
    }

    if (access.role === UserRoleEnum.USER) {
      orderQb.andWhere("order.userId = :userId", { userId: access.userId });
    }

    if (access.role === UserRoleEnum.VENDOR) {
      orderQb.innerJoin("order.vendorOrders", "accessVendorOrder", "accessVendorOrder.vendorId = :vendorId", {
        vendorId: access.vendorId,
      });
    }

    const order = await orderQb.getOne();

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const vendorOrdersQb = this.databaseService
      .getRepository(VendorOrderEntity)
      .createQueryBuilder("vendorOrder")
      .leftJoin("vendorOrder.vendor", "vendor")
      .leftJoinAndSelect("vendorOrder.orderItems", "orderItem")
      .select([...ORDER_SELECT_FIELDS.VENDOR_ORDER_FOR_DETAILS, ...ORDER_SELECT_FIELDS.ORDER_ITEM_FOR_DETAILS])
      .where("vendorOrder.orderId = :orderId", { orderId });

    if (access.role === UserRoleEnum.VENDOR) {
      vendorOrdersQb.andWhere("vendorOrder.vendorId = :vendorId", { vendorId: access.vendorId });
    }

    const vendorOrders = await vendorOrdersQb.getMany();

    if (isAdmin) {
      return buildAdminOrderDetailsResponse(
        order,
        {
          id: order.user.id,
          firstName: order.user.firstName,
          lastName: order.user.lastName,
          email: order.user.email,
          phoneNumber: order.user.phoneNumber,
        },
        vendorOrders,
      );
    }

    return buildOrderDetailsResponse(order, vendorOrders);
  }

  private applyOrderFilters({
    qb,
    access,
    search,
    status,
    paymentStatus,
    paymentMethod,
  }: {
    qb: SelectQueryBuilder<OrderEntity>;
    access: OrderAccessContext;
    search?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
  }): void {
    if (access.role === UserRoleEnum.USER) {
      qb.where("order.userId = :userId", { userId: access.userId });
    }

    if (access.role === UserRoleEnum.VENDOR) {
      qb.innerJoin("order.vendorOrders", "vendorOrder", "vendorOrder.vendorId = :vendorId", {
        vendorId: access.vendorId,
      });
    }

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
      data: buildOrderListResponse(data),
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
    const result = await this.databaseService.executeTransaction({
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

        const wasRefunded = isOnlinePayment && dto.status === VendorOrderStatusEnum.CANCELLED;

        if (wasRefunded) {
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
        return {
          orderId: vendorOrder.order.id,
          userId: vendorOrder.order.userId,
          totalAmount: String(vendorOrder.order.totalAmount),
          newStatus: dto.status,
          wasRefunded,
        };
      },
      errorContext: ORDER_ERROR_CONTEXT.UPDATE_ORDER_STATUS,
    });

    const userRepository = this.databaseService.getRepository(UsersEntity);

    const user = await userRepository.findOne({ where: { id: result.userId } });

    if (result.newStatus === VendorOrderStatusEnum.PROCESSING) {
      this.eventEmitter.emit(OrderEvents.ORDER_CONFIRMED, {
        orderId: result.orderId,
        userEmail: user?.email ?? "",
        firstName: user?.firstName ?? "",
        totalAmount: result.totalAmount,
      });
    }

    if (result.newStatus === VendorOrderStatusEnum.DELIVERED) {
      this.eventEmitter.emit(OrderEvents.ORDER_DELIVERED, {
        orderId: result.orderId,
        userEmail: user?.email ?? "",
        firstName: user?.firstName ?? "",
      });
    }

    if (result.newStatus === VendorOrderStatusEnum.CANCELLED) {
      this.eventEmitter.emit(OrderEvents.ORDER_CANCELLED_BY_VENDOR, {
        orderId: result.orderId,
        userEmail: user?.email ?? "",
        firstName: user?.firstName ?? "",
      });

      if (result.wasRefunded) {
        const vendorRepository = this.databaseService.getRepository(VendorProfileEntity);

        const vendor = await vendorRepository.findOne({ where: { id: vendorId! } });

        this.eventEmitter.emit(OrderEvents.ORDER_REFUNDED, {
          orderId: result.orderId,
          amount: result.totalAmount,
          userEmail: user?.email ?? "",
          firstName: user?.firstName,
          vendorEmail: vendor?.businessEmail ?? "",
          vendorName: vendor?.businessName,
        });
      }
    }

    await invalidateCache(this.redisService, result.orderId, result.userId, vendorId);
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const result = await this.databaseService.executeTransaction({
      errorContext: ORDER_ERROR_CONTEXT.CANCEL_ORDER,
      operation: async (queryRunner: QueryRunner) => {
        const order = await this.loadOrderForCancellation(orderId, userId, queryRunner);

        if (order.status === OrderStatusEnum.CANCELLED) {
          throw new BadRequestException(ERROR_MESSAGES.ORDER_ALREADY_CANCELLED);
        }

        const vendorOrders = await this.loadVendorOrdersForCancellation(orderId, queryRunner);

        this.validateVendorOrdersForCancellation(vendorOrders);

        const orderItems = await this.loadOrderItems(orderId, queryRunner);

        await this.atomicStockIncrement(orderItems, queryRunner);

        await this.cancelVendorOrders(vendorOrders, queryRunner);

        const isOnlinePayment = order.paymentMethod === PaymentMethodEnum.RAZORPAY;

        const wasRefunded = isOnlinePayment && order.paymentStatus === PaymentStatusEnum.PAID;

        if (wasRefunded) {
          await this.razorpayService.refundPayment(order.razorpayPaymentId!);
        }

        await queryRunner.manager.update(OrderEntity, order.id, {
          status: OrderStatusEnum.CANCELLED,
          ...(wasRefunded && {
            paymentStatus: PaymentStatusEnum.REFUNDED,
          }),
        });

        return { wasRefunded, totalAmount: String(order.totalAmount) };
      },
    });

    const userRepository = this.databaseService.getRepository(UsersEntity);

    const user = await userRepository.findOne({ where: { id: userId } });

    this.eventEmitter.emit(OrderEvents.ORDER_CANCELLED_BY_USER, {
      orderId,
      userEmail: user?.email ?? "",
      firstName: user?.firstName ?? "",
    });

    if (result.wasRefunded) {
      const vendorOrderRepository = this.databaseService.getRepository(VendorOrderEntity);

      const vendorOrders = await vendorOrderRepository
        .createQueryBuilder("vendorOrder")
        .leftJoinAndSelect("vendorOrder.vendor", "vendor")
        .where("vendorOrder.orderId = :orderId", { orderId })
        .getMany();

      for (const vendorOrder of vendorOrders) {
        this.eventEmitter.emit(OrderEvents.ORDER_REFUNDED, {
          orderId,
          amount: result.totalAmount,
          userEmail: user?.email ?? "",
          firstName: user?.firstName,
          vendorEmail: vendorOrder.vendor.businessEmail,
          vendorName: vendorOrder.vendor.businessName,
        });
      }
    }

    await invalidateCache(this.redisService, orderId, userId);
  }

  private async loadOrderForCancellation(
    orderId: string,
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<OrderEntity> {
    const order = await queryRunner.manager
      .getRepository(OrderEntity)
      .createQueryBuilder("order")
      .select(ORDER_SELECT_FIELDS.ORDER_FOR_PAYMENT)
      .where("order.id = :orderId AND order.userId = :userId", { orderId, userId })
      .setLock("pessimistic_write")
      .getOne();

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  private async loadVendorOrdersForCancellation(
    orderId: string,
    queryRunner: QueryRunner,
  ): Promise<VendorOrderEntity[]> {
    return queryRunner.manager
      .getRepository(VendorOrderEntity)
      .createQueryBuilder("vendorOrder")
      .select(ORDER_SELECT_FIELDS.VENDOR_ORDER)
      .where("vendorOrder.orderId = :orderId", { orderId })
      .getMany();
  }

  private validateVendorOrdersForCancellation(vendorOrders: VendorOrderEntity[]): void {
    const cancellableStatuses = new Set([VendorOrderStatusEnum.PENDING, VendorOrderStatusEnum.PROCESSING]);

    for (const vendorOrder of vendorOrders) {
      if (!cancellableStatuses.has(vendorOrder.status)) {
        throw new BadRequestException(ERROR_MESSAGES.VENDOR_ORDER_NOT_CANCELLABLE);
      }
    }
  }

  private async loadOrderItems(orderId: string, queryRunner: QueryRunner): Promise<OrderItemEntity[]> {
    return queryRunner.manager
      .getRepository(OrderItemEntity)
      .createQueryBuilder("orderItem")
      .select(ORDER_SELECT_FIELDS.ORDER_ITEM)
      .innerJoin(VendorOrderEntity, "vendorOrder", "vendorOrder.id = orderItem.vendorOrderId")
      .where("vendorOrder.orderId = :orderId", { orderId })
      .getMany();
  }

  private async atomicStockIncrement(orderItems: OrderItemEntity[], queryRunner: QueryRunner): Promise<void> {
    for (const orderItem of orderItems) {
      await queryRunner.manager
        .createQueryBuilder()
        .update(ProductEntity)
        .set({ stock: () => `stock + ${orderItem.quantity}` })
        .where("id = :productId", { productId: orderItem.productId })
        .execute();
    }
  }

  private async cancelVendorOrders(vendorOrders: VendorOrderEntity[], queryRunner: QueryRunner): Promise<void> {
    const vendorOrderIds = vendorOrders.map(({ id }) => id);

    await queryRunner.manager
      .getRepository(VendorOrderEntity)
      .createQueryBuilder()
      .update(VendorOrderEntity)
      .set({
        status: VendorOrderStatusEnum.CANCELLED,
      })
      .where("id IN (:...vendorOrderIds)", {
        vendorOrderIds,
      })
      .execute();
  }
}
