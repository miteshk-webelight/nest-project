import { Injectable } from "@nestjs/common";

import { ulid } from "ulid";

import { DatabaseService } from "../database/database.service";

import { GUEST_TOKEN_PREFIX } from "./carts.constants";

@Injectable()
export class CartsService {
  constructor(private readonly databaseService: DatabaseService) {}

  generateGuestToken(): { guestToken: string } {
    return {
      guestToken: `${GUEST_TOKEN_PREFIX}_${ulid()}`,
    };
  }
}
