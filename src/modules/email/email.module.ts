import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EmailProviderEntity } from "./email-provider.entity";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";
import { EmailTemplateRegistry } from "./registries/email-template.registry";

@Module({
  imports: [TypeOrmModule.forFeature([EmailProviderEntity])],
  controllers: [EmailController],
  providers: [EmailService, EmailTemplateRegistry],
  exports: [EmailService, EmailTemplateRegistry],
})
export class EmailModule {}
