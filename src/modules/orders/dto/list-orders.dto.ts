import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEnum, IsOptional } from "class-validator";

import { PaginationQueryDto } from "src/dto/pagination-query.dto";

import { OrderSortByEnum, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from "../orders.enums";

export class ListOrdersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatusEnum })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @ApiPropertyOptional({ enum: PaymentStatusEnum })
  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  paymentStatus?: PaymentStatusEnum;

  @ApiPropertyOptional({ enum: PaymentMethodEnum })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  @ApiPropertyOptional({ enum: OrderSortByEnum, default: OrderSortByEnum.CREATED_AT })
  @IsOptional()
  @IsEnum(OrderSortByEnum)
  sortBy?: OrderSortByEnum = OrderSortByEnum.CREATED_AT;
}
