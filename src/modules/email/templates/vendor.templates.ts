import { buildEmailLayout } from "../builders/email-layout.builder";

export interface VendorRegistrationAdminData {
  businessName: string;
  ownerName: string;
}

export interface VendorData {
  vendorName: string;
}

export interface VendorRegistrationReceivedData {
  ownerFirstName: string;
  businessName: string;
}

export const vendorEmailTemplates = {
  registrationAdmin: {
    subject(data: VendorRegistrationAdminData) {
      return `New Vendor Registration: ${data.businessName}`;
    },

    html(data: VendorRegistrationAdminData): string {
      const content = `
        <p>Hi Admin,</p>

        <p>A new vendor registration request has been submitted and is awaiting your review.</p>

        <p><strong>Business Name:</strong> ${data.businessName}<br />
        <strong>Submitted By:</strong> ${data.ownerName}</p>

        <p>Please log in to the admin dashboard to review this application.</p>
      `.trim();

      return buildEmailLayout({ title: "New Vendor Registration", content });
    },
  },

  registrationReceived: {
    subject(_data: VendorRegistrationReceivedData) {
      return "Vendor Registration Received";
    },

    html(data: VendorRegistrationReceivedData): string {
      const content = `
        <p>Hi ${data.ownerFirstName},</p>

        <p>Thank you for registering as a vendor with us.</p>

        <p>Your application for <strong>${data.businessName}</strong> has been received and is currently under review.</p>

        <p>We will notify you once the review is complete.</p>
      `.trim();

      return buildEmailLayout({ title: "Registration Received", content });
    },
  },

  approved: {
    subject(_data: VendorData) {
      return "Vendor Account Approved";
    },

    html(data: VendorData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>We are pleased to inform you that your vendor account has been approved.</p>

        <p>You can now log in and start managing your products and listings.</p>
      `.trim();

      return buildEmailLayout({ title: "Account Approved", content });
    },
  },

  rejected: {
    subject(_data: VendorData) {
      return "Vendor Account Update";
    },

    html(data: VendorData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>After careful review, we regret to inform you that your vendor account has been rejected.</p>

        <p>If you have any questions, please feel free to contact our support team.</p>
      `.trim();

      return buildEmailLayout({ title: "Account Update", content });
    },
  },

  suspended: {
    subject(_data: VendorData) {
      return "Vendor Account Suspended";
    },

    html(data: VendorData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>Your vendor account has been suspended.</p>

        <p>If you have any questions, please contact our support team for further assistance.</p>
      `.trim();

      return buildEmailLayout({ title: "Account Suspended", content });
    },
  },

  deleted: {
    subject(_data: VendorData) {
      return "Vendor Account Removed";
    },

    html(data: VendorData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>Your vendor account has been removed from our platform.</p>

        <p>If you believe this is a mistake, please contact our support team.</p>
      `.trim();

      return buildEmailLayout({ title: "Account Removed", content });
    },
  },
};
