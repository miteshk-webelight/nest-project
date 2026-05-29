import { type ClassConstructor, plainToInstance } from "class-transformer";
import { ulid } from "ulid";

import type { ObjectLiteral } from "typeorm";
import type { SelectQueryBuilder } from "typeorm/query-builder/SelectQueryBuilder";

export function transformToInstance<T, V>(cls: ClassConstructor<T>, data: V | V[]): T | T[] {
  return plainToInstance(cls, data, {
    excludeExtraneousValues: true,
  });
}
export const generateOtp = (): number => {
  return Math.floor(100000 + Math.random() * 900000);
};
export const pagination = (page: number, limit: number): number => {
  const offset = (page - 1) * limit;

  return offset;
};
export function generateSlug(name: string, randomSuffix?: boolean): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  if (randomSuffix) {
    const random = ulid().slice(-6).toLowerCase();

    slug += `-${random}`;
  }

  return slug;
}

export const applyPagination = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  {
    page = 1,
    limit = 10,
    isPagination = true,
  }: {
    page?: number;
    limit?: number;
    isPagination?: boolean;
  },
): void => {
  if (!isPagination) {
    return;
  }

  const offset = pagination(page, limit);

  qb.skip(offset).take(limit);
};
