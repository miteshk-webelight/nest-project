import { PartialType } from "@nestjs/swagger";

import { RegisterVendorDto } from "./register-vendor.dto";

export class UpdateVendorProfileDto extends PartialType(RegisterVendorDto) {}
