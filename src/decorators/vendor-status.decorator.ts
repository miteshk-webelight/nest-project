import { SetMetadata } from "@nestjs/common";

import type { VendorStatusEnum } from "../modules/users/constants/enum";

export const VENDOR_STATUS_KEY = "vendor_status";

export const VendorStatus = (...statuses: VendorStatusEnum[]) => SetMetadata(VENDOR_STATUS_KEY, statuses);
