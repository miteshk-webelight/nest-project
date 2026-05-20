import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { ERROR_MESSAGES } from "../../constants/app.constants";

import { UpdateUserSessionDto, UserSessionDto } from "./userSession.dto";
import { UserSessionEntity } from "./userSession.entity";

@Injectable()
export class UserSessionService {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly userSessionRepository: Repository<UserSessionEntity>,
  ) {}

  async create(userSessionDto: UserSessionDto): Promise<UserSessionEntity> {
    const userSession = this.userSessionRepository.create(userSessionDto);
    return this.userSessionRepository.save(userSession);
  }

  async update(id: string, userSessionDto: UpdateUserSessionDto): Promise<void> {
    const session = await this.userSessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_SID);
    }
    Object.assign(session, userSessionDto);
    await this.userSessionRepository.save(session);
  }

  async findActiveById(id: string): Promise<UserSessionEntity> {
    const session = await this.userSessionRepository.findOne({ where: { id } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_SID);
    }

    return session;
  }

  async revoke(id: string): Promise<void> {
    await this.update(id, { revokedAt: new Date() });
  }
}
