import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthHelperService } from "../modules/auth/auth.helper.service";
import { UsersEntity } from "../modules/users/entity/users.entity";

@Injectable()
export class AuthGuard {
  private readonly authService = new AuthHelperService();

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { atk } = req.cookies;

    if (!atk) {
      throw new UnauthorizedException("Unauthorized");
    }

    const { sub } = this.authService.validateGuardRequest(atk);

    try {
      const user = await this.usersRepository.findOne({ where: { id: sub } });

      if (!user) {
        throw new UnauthorizedException("Unauthorized");
      }

      req.user = user;

      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
