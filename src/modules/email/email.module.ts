import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EmailProviderEntity } from "./email-provider.entity";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";

@Module({
  imports: [TypeOrmModule.forFeature([EmailProviderEntity])],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
