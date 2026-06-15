/* eslint-disable @cspell/spellchecker */
import { BadRequestException, Injectable } from "@nestjs/common";

import { QueryRunner } from "typeorm";

import { decryptValue, encryptValue } from "../../utils/encryption.utils";
import { DatabaseService } from "../database/database.service";
import { RedisService } from "../redis/redis.service";

import { SaveEmailProviderDto } from "./dto/save-email-provider.dto";
import { EmailProviderEntity } from "./email-provider.entity";
import {
  EmailProviderEnum,
  EMAIL_CACHE_KEY,
  EMAIL_CACHE_TTL,
  ERROR_MESSAGES,
  PROVIDER_SELECT_FIELDS,
  SUCCESS_MESSAGES,
} from "./email.constants";
import { BrevoProvider } from "./providers/brevo.provider";
import { ResendProvider } from "./providers/resend.provider";
import { SmtpProvider } from "./providers/smtp.provider";

import type { BrevoConfig, ResendConfig, SendEmailOptions, SmtpConfig } from "./email-provider.interface";

@Injectable()
export class EmailService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Validates and saves the active email provider configuration.
   */
  async saveProvider(dto: SaveEmailProviderDto): Promise<{ message: string }> {
    const config = this.buildProviderConfig(dto);

    const provider = this.instantiateProvider(dto.provider, config);

    const validatePayload = { ...dto };
    await provider.validate(validatePayload);

    const encryptedConfig = encryptValue(JSON.stringify({ ...config, provider: dto.provider }));

    await this.databaseService.executeTransaction({
      operation: async (queryRunner: QueryRunner) => {
        const repository = queryRunner.manager.getRepository(EmailProviderEntity);

        const existing = await repository.createQueryBuilder("provider").select(PROVIDER_SELECT_FIELDS.BASIC).getOne();

        if (existing) {
          await repository.update(existing.id, {
            provider: dto.provider,
            encryptedConfig,
            isActive: true,
          });
        } else {
          const entity = repository.create({
            provider: dto.provider,
            encryptedConfig,
            isActive: true,
          });
          await repository.save(entity);
        }
      },
      errorContext: "Save Email Provider",
    });

    await this.redisService.delete([EMAIL_CACHE_KEY]);

    return { message: SUCCESS_MESSAGES.PROVIDER_CONFIGURED };
  }

  /**
   * Returns the currently configured email provider.
   */
  async getProvider(): Promise<{ provider: EmailProviderEnum; isActive: boolean }> {
    const providerEntity = await this.databaseService
      .getRepository(EmailProviderEntity)
      .createQueryBuilder("provider")
      .select(PROVIDER_SELECT_FIELDS.STATUS)
      .getOne();

    if (!providerEntity) {
      throw new BadRequestException(ERROR_MESSAGES.PROVIDER_NOT_FOUND);
    }

    return {
      provider: providerEntity.provider,
      isActive: providerEntity.isActive,
    };
  }

  /**
   * Sends an email using the currently active email provider.
   *
   * @param options Email payload containing recipient, subject, and content.
   * @returns Promise<void>
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const providerEntity = await this.getActiveProviderEntity();

    const decryptedConfig = decryptValue(providerEntity.encryptedConfig);
    const config = JSON.parse(decryptedConfig) as Record<string, unknown>;

    const provider = this.instantiateProvider(providerEntity.provider, config);

    await provider.sendEmail(options);
  }

  /**
   * Retrieves the active provider configuration from cache or database.
   */
  private async getActiveProviderEntity(): Promise<EmailProviderEntity> {
    return this.redisService.getOrSet<EmailProviderEntity>({
      key: EMAIL_CACHE_KEY,
      ttl: EMAIL_CACHE_TTL,
      fetcher: async () => {
        const entity = await this.databaseService
          .getRepository(EmailProviderEntity)
          .createQueryBuilder("provider")
          .select(PROVIDER_SELECT_FIELDS.BASIC)
          .where("provider.isActive = :isActive", { isActive: true })
          .getOne();

        if (!entity) {
          throw new BadRequestException(ERROR_MESSAGES.PROVIDER_NOT_FOUND);
        }

        return entity;
      },
    });
  }

  private buildProviderConfig(dto: SaveEmailProviderDto): Record<string, unknown> {
    const config: Record<string, unknown> = {};

    if (dto.fromEmail) {
      config.fromEmail = dto.fromEmail;
    }

    switch (dto.provider) {
      case EmailProviderEnum.RESEND:
        config.resendApiKey = dto.resendApiKey;
        break;
      case EmailProviderEnum.BREVO:
        config.apiKey = dto.brevoApiKey;
        break;
      case EmailProviderEnum.SMTP:
        config.host = dto.host;
        config.port = dto.port;
        config.username = dto.username;
        config.password = dto.password;
        break;
    }

    return config;
  }

  private instantiateProvider(
    provider: EmailProviderEnum,
    config: Record<string, unknown>,
  ): ResendProvider | BrevoProvider | SmtpProvider {
    switch (provider) {
      case EmailProviderEnum.RESEND:
        return new ResendProvider(config as unknown as ResendConfig);
      case EmailProviderEnum.BREVO:
        return new BrevoProvider(config as unknown as BrevoConfig);
      case EmailProviderEnum.SMTP:
        return new SmtpProvider(config as unknown as SmtpConfig);
      default:
        throw new BadRequestException(ERROR_MESSAGES.INVALID_PROVIDER);
    }
  }
}
