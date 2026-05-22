import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Type } from "@nestjs/common";

import { UserRoleEnum } from "../modules/users/user.constants";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function RoleGuard(...roles: UserRoleEnum[]): Type<CanActivate> {
  @Injectable()
  class RoleAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const { user } = context.switchToHttp().getRequest();

      if (!user) {
        throw new ForbiddenException("Access denied");
      }

      const hasRole = roles.includes(user.role);

      if (!hasRole) {
        throw new ForbiddenException("Insufficient permissions");
      }

      return true;
    }
  }

  return RoleAuthGuard;
}
