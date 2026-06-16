import { Module } from "@nestjs/common";

import { ClsModule } from "nestjs-cls";

import { clsConfig } from "src/config/cls.config";

import { DatabaseModule } from "../database/database.module";
import { EmailModule } from "../email/email.module";
import { RedisModule } from "../redis/redisModule";

import { WelcomeEmailHandler } from "./handlers/welcome-email.handler";
import { EmailProcessor } from "./processors/email.processor";
import { emailQueueProvider } from "./queues/email.queue";
import { EMAIL_QUEUE_TOKEN } from "./queues/queue.constants";
import { EmailJobHandlerRegistry } from "./registry/email-job-handler.registry";
import { EmailQueueService } from "./services/email-queue.service";

@Module({
  imports: [ClsModule.forRoot(clsConfig), DatabaseModule, RedisModule, EmailModule],
  providers: [emailQueueProvider, EmailQueueService, EmailProcessor, EmailJobHandlerRegistry, WelcomeEmailHandler],
  exports: [EMAIL_QUEUE_TOKEN, EmailQueueService],
})
export class WorkersModule {}
