import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import { ClsService } from "nestjs-cls";

import { AuthHelperService } from "../modules/auth/auth.helper.service";
import { DatabaseService } from "../modules/database/database.service";
import { UsersEntity } from "../modules/users/entity/users.entity";
import { UserRoleEnum } from "../modules/users/user.constants";
import { VendorProfileEntity } from "../modules/vendors/vendor.profile.entity";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly authService = new AuthHelperService();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clsService: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const { atk } = req.cookies ?? {};

    if (!atk) {
      return true;
    }

    try {
      const { sub } = this.authService.validateGuardRequest(atk);
      const usersRepository = this.databaseService.getRepository(UsersEntity);
      const user = await usersRepository.findOne({ where: { id: sub } });

      if (!user) {
        throw new UnauthorizedException("Unauthorized");
      }

      req.user = user;
      this.clsService.set("userId", user.id);

      if (user.role === UserRoleEnum.VENDOR) {
        const vendorProfileRepository = this.databaseService.getRepository(VendorProfileEntity);
        req.vendorProfile = await vendorProfileRepository.findOne({
          where: { userId: user.id },
        });
      }

      return true;
    } catch {
      // If token validation fails, we simply treat the request as unauthenticated and it will behave as a public request.
      return true;
    }
  }
}
