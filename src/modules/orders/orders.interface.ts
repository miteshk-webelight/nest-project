import type { AddressEntity } from "../users/entity/address.entity";
import type { UserRoleEnum } from "../users/user.constants";
import type { OrderItemEntity } from "./entities/order-item.entity";
import type { OrderEntity } from "./entities/order.entity";
import type { VendorOrderEntity } from "./entities/vendor-order.entity";
import type { CartItemEntity } from "../carts/entities/cart-items.entity";
import type { ProductEntity } from "../products/product.entity";
import type { QueryRunner } from "typeorm";

export interface OrderAccessContext {
  role: UserRoleEnum;
  userId: string;
  vendorId?: string;
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
      };
    };
  };
}

export interface RazorpayWebhookEvent {
  event: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
}
export type ProductMap = Map<string, ProductEntity>;

export interface TransactionContext {
  queryRunner: QueryRunner;
}

export interface UserContext {
  userId: string;
}

export interface AddressContext {
  addressId: string;
}

export interface CartContext {
  cartId: string;
}

export interface OrderContext {
  orderId: string;
}

export interface ProductIdsContext {
  productIds: string[];
}

export interface ProductsMapContext {
  productsMap: Map<string, ProductEntity>;
}

export interface GroupedItemsContext {
  groupedItems: GroupedCartItems[];
}

export interface VendorOrdersContext {
  vendorOrders: VendorOrderEntity[];
}

export interface GroupedCartItems {
  vendorId: string;
  cartItems: CartItemEntity[];
}

export interface PricingSummaryContext {
  pricingSummary: CheckoutPricingSummary;
}

export interface ItemPricing {
  unitPrice: number;
  totalPrice: number;
}

export interface PricedCartItem extends ItemPricing {
  cartItem: CartItemEntity;
  product: ProductEntity;
}

export interface VendorCheckoutGroup {
  vendorId: string;
  totalAmount: number;
  items: PricedCartItem[];
}

export interface CheckoutPricingSummary {
  totalAmount: number;
  groups: VendorCheckoutGroup[];
}
export interface CreateOrderRecordParams extends TransactionContext, UserContext, AddressContext {
  totalAmount: number;
}

export interface OrderWithAddress extends Omit<OrderEntity, "address"> {
  address: AddressEntity;
}

export interface OrderUserSummary {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
}
export interface VendorOrderWithVendor extends VendorOrderEntity {
  businessName: string;
  orderItems: OrderItemEntity[];
}

export interface LoadValidatedAddressParams extends TransactionContext, UserContext, AddressContext {}

export interface LoadValidatedCartParams extends TransactionContext, UserContext {}

export interface LoadCartItemsParams extends TransactionContext, CartContext {}

export interface LoadValidatedProductsParams extends TransactionContext, ProductIdsContext {}

export interface CreateVendorOrdersParams extends TransactionContext, OrderContext, PricingSummaryContext {}

export interface CreateOrderItemsParams extends TransactionContext, VendorOrdersContext, PricingSummaryContext {}

export interface CreateOrderParams extends TransactionContext, UserContext, AddressContext, PricingSummaryContext {}
