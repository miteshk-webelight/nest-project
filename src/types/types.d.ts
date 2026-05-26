/* eslint-disable @typescript-eslint/consistent-type-imports */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

type SearchType = { key: string; value: string };

declare namespace Express {
  export interface Request {
    user: import("src/modules/users/entity/users.entity").UsersEntity;
    vendorProfile?: import("src/modules/vendors/vendor.profile.entity").VendorProfileEntity;
  }
}
