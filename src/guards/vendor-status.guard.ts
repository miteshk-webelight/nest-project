import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { VENDOR_STATUS_KEY } from "../decorators/vendor-status.decorator";
import { VendorStatusEnum } from "../modules/users/constants/enum";
import { VendorProfileEntity } from "../modules/users/vendor.profile.entity";

@Injectable()
export class VendorStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(VendorProfileEntity)
    private readonly vendorRepository: Repository<VendorProfileEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredStatuses = this.reflector.getAllAndOverride<VendorStatusEnum[]>(VENDOR_STATUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No decorator used
    if (!requiredStatuses.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const { user } = req;

    // Fetch vendor profile
    const vendorProfile = await this.vendorRepository.findOne({
      where: {
        userId: user.id,
      },
    });

    if (!vendorProfile) {
      throw new ForbiddenException("Vendor profile not found");
    }

    // Validate status
    if (!requiredStatuses.includes(vendorProfile.status)) {
      throw new ForbiddenException(`Vendor account is ${vendorProfile.status}`);
    }

    // attach vendor profile
    req.vendorProfile = vendorProfile;

    return true;
  }
}
