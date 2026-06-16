import { Injectable } from "@nestjs/common";

import { EMAIL_TYPES } from "../constants/email-types.constants";
import { authEmailTemplates, AuthWelcomeData } from "../templates/auth.templates";
import {
  vendorEmailTemplates,
  VendorData,
  VendorRegistrationAdminData,
  VendorRegistrationReceivedData,
} from "../templates/vendor.templates";

export interface EmailTemplate<T> {
  subject: (data: T) => string;
  html: (data: T) => string;
}

@Injectable()
export class EmailTemplateRegistry {
  private readonly templates = new Map<string, EmailTemplate<unknown>>();

  constructor() {
    this.register<AuthWelcomeData>(EMAIL_TYPES.AUTH_WELCOME, authEmailTemplates.welcome);

    this.register<VendorRegistrationAdminData>(
      EMAIL_TYPES.VENDOR_REGISTRATION_ADMIN,
      vendorEmailTemplates.registrationAdmin,
    );
    this.register<VendorRegistrationReceivedData>(
      EMAIL_TYPES.VENDOR_REGISTRATION_RECEIVED,
      vendorEmailTemplates.registrationReceived,
    );
    this.register<VendorData>(EMAIL_TYPES.VENDOR_APPROVED, vendorEmailTemplates.approved);
    this.register<VendorData>(EMAIL_TYPES.VENDOR_REJECTED, vendorEmailTemplates.rejected);
    this.register<VendorData>(EMAIL_TYPES.VENDOR_SUSPENDED, vendorEmailTemplates.suspended);
    this.register<VendorData>(EMAIL_TYPES.VENDOR_DELETED, vendorEmailTemplates.deleted);
  }

  private register<T>(type: string, template: EmailTemplate<T>): void {
    if (this.templates.has(type)) {
      throw new Error(`Template already registered for email type: ${type}`);
    }

    this.templates.set(type, template);
  }

  get<T>(type: string): EmailTemplate<T> {
    const template = this.templates.get(type);

    if (!template) {
      throw new Error(`No template registered for email type: ${type}`);
    }

    return template;
  }
}
