import { Module } from "@nestjs/common";

import { ClsModule } from "nestjs-cls";

import { clsConfig } from "src/config/cls.config";

import { DatabaseModule } from "../database/database.module";
import { EmailModule } from "../email/email.module";
import { RedisModule } from "../redis/redisModule";

import { EmailProcessor } from "./processors/email.processor";
import { emailQueueProvider } from "./queues/email.queue";
import { EMAIL_QUEUE_TOKEN } from "./queues/queue.constants";
import { EmailJobHandler } from "./services/email-job.handler";
import { EmailQueueService } from "./services/email-queue.service";

@Module({
  imports: [ClsModule.forRoot(clsConfig), DatabaseModule, RedisModule, EmailModule],
  providers: [emailQueueProvider, EmailQueueService, EmailProcessor, EmailJobHandler],
  exports: [EMAIL_QUEUE_TOKEN, EmailQueueService],
})
export class WorkersModule {}
