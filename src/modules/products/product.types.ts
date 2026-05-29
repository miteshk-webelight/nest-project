import type { MediaEntity } from "../media/media.entity";
import type { UpdateProductDto } from "./dto/update-product.dto";
import type { ProductEntity } from "./product.entity";
import type { Repository } from "typeorm";

export interface ProductWithMedia {
  id: string;
  vendorId: string;
  categoryId: string;

  name: string;
  slug: string;
  sku: string;

  description?: string;

  price: number;
  discountPrice?: number;

  stock: number;

  status: string;
  isActive: boolean;

  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  media: MediaEntity[];
}

export type ValidateProductUpdateParams = {
  dto: UpdateProductDto;
  product: ProductEntity;
  productId: string;
  vendorId: string;
  productRepository: Repository<ProductEntity>;
  validateCategoryExistsAndActive: (categoryId: string) => Promise<void>;
};
