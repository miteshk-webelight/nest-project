import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CartsModule } from "../carts/carts.module";
import { CartItemEntity } from "../carts/entities/cart-items.entity";
import { CartEntity } from "../carts/entities/carts.entity";
import { DatabaseModule } from "../database/database.module";
import { PaymentsModule } from "../payments/payments.module";
import { ProductEntity } from "../products/product.entity";
import { ProductsModule } from "../products/products.module";
import { UsersModule } from "../users/users.module";
import { VendorProfileEntity } from "../vendors/vendor.profile.entity";
import { VendorsModule } from "../vendors/vendors.module";

import { OrdersController } from "./controllers/orders.controller";
import { WebhooksController } from "./controllers/webhooks.controller";
import { OrderItemEntity } from "./entities/order-item.entity";
import { OrderEntity } from "./entities/order.entity";
import { VendorOrderEntity } from "./entities/vendor-order.entity";
import { CheckoutService } from "./services/checkout.service";
import { OrderService } from "./services/order.service";
import { PaymentService } from "./services/payment.service";
import { WebhookService } from "./services/webhook.service";

@Module({
  imports: [
    DatabaseModule,
    CartsModule,
    ProductsModule,
    UsersModule,
    VendorsModule,
    PaymentsModule,
    TypeOrmModule.forFeature([
      CartEntity,
      CartItemEntity,
      ProductEntity,
      VendorProfileEntity,
      OrderItemEntity,
      VendorOrderEntity,
      OrderEntity,
    ]),
  ],
  controllers: [OrdersController, WebhooksController],
  providers: [CheckoutService, PaymentService, WebhookService, OrderService],
  exports: [CheckoutService, PaymentService, WebhookService, OrderService],
})
export class OrdersModule {}
