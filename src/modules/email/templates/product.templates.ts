import { buildEmailLayout } from "../builders/email-layout.builder";

export interface ProductSubmittedAdminData {
  productName: string;
  vendorName: string;
}

export interface ProductStatusChangeData {
  productName: string;
  vendorName: string;
}

export const productEmailTemplates = {
  submittedForReviewAdmin: {
    subject(data: ProductSubmittedAdminData) {
      return `New Product Submitted for Review: ${data.productName}`;
    },

    html(data: ProductSubmittedAdminData): string {
      const content = `
        <p>Hi Admin,</p>

        <p><strong>${data.vendorName}</strong> has submitted a new product for review.</p>

        <p><strong>Product Name:</strong> ${data.productName}</p>

        <p>Please log in to the admin dashboard to review this product.</p>
      `.trim();

      return buildEmailLayout({ title: "New Product Submission", content });
    },
  },

  approved: {
    subject(_data: ProductStatusChangeData) {
      return "Product Approved";
    },

    html(data: ProductStatusChangeData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>Your product <strong>${data.productName}</strong> has been approved and is now live.</p>

        <p>You can view and manage your product from your vendor dashboard.</p>
      `.trim();

      return buildEmailLayout({ title: "Product Approved", content });
    },
  },

  rejected: {
    subject(_data: ProductStatusChangeData) {
      return "Product Update";
    },

    html(data: ProductStatusChangeData): string {
      const content = `
        <p>Hi ${data.vendorName},</p>

        <p>After careful review, your product <strong>${data.productName}</strong> has been rejected.</p>

        <p>If you have any questions, please feel free to contact our support team.</p>
      `.trim();

      return buildEmailLayout({ title: "Product Update", content });
    },
  },
};
