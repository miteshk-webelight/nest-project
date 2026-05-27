import type { MediaEntity } from "../media/media.entity";

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
