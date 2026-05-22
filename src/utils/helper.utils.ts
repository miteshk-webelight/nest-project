import { type ClassConstructor, plainToInstance } from "class-transformer";

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
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
