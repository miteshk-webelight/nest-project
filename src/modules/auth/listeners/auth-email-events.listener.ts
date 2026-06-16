import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { EMAIL_TYPES } from "../../email/constants/email-types.constants";
import { EmailQueueService } from "../../workers/services/email-queue.service";
import { AuthEvents, type UserSignedUpEventPayload } from "../constants/auth-events";

@Injectable()
export class AuthEmailEventsListener {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @OnEvent(AuthEvents.USER_SIGNED_UP)
  async handleUserSignedUp(payload: UserSignedUpEventPayload): Promise<void> {
    await this.emailQueueService.addEmailJob({
      type: EMAIL_TYPES.AUTH_WELCOME,
      email: payload.email,
      data: { firstName: payload.firstName },
    });
  }
}
