import { Injectable } from "@nestjs/common";

import type { EmailJobHandler } from "../handlers/email-job-handler.interface";

@Injectable()
export class EmailJobHandlerRegistry {
  private readonly handlerMap = new Map<string, EmailJobHandler>();

  register(handler: EmailJobHandler): void {
    const key = handler.jobName;

    if (this.handlerMap.has(key)) {
      throw new Error(`Handler already registered for job: ${key}`);
    }

    this.handlerMap.set(key, handler);
  }

  get<T>(jobName: string): EmailJobHandler<T> | undefined {
    return this.handlerMap.get(jobName);
  }
}
