"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { mutateById } from "@/lib/mock-subscription-store";

export async function PUT(request: NextRequest) {
  return handleRequest(request, "/api/subscription/invoice-notifications", {
    mockFactoryWithBody: (body) => {
      const { subscriptionId, invoiceNotifications, additionalInvoiceEmails } = body as {
        subscriptionId: string;
        invoiceNotifications?: {
          onRenewal?: boolean;
          copyToBillingContact?: boolean;
          renewalReminder7Days?: boolean;
          failedPaymentAlert?: boolean;
        };
        additionalInvoiceEmails?: string[];
      };
      const updated = mutateById(subscriptionId, (sub) => ({
        ...sub,
        invoice_notifications: {
          on_renewal:
            invoiceNotifications?.onRenewal ?? sub.invoice_notifications.on_renewal,
          copy_to_billing_contact:
            invoiceNotifications?.copyToBillingContact ?? sub.invoice_notifications.copy_to_billing_contact,
          renewal_reminder_7_days:
            invoiceNotifications?.renewalReminder7Days ?? sub.invoice_notifications.renewal_reminder_7_days,
          failed_payment_alert:
            invoiceNotifications?.failedPaymentAlert ?? sub.invoice_notifications.failed_payment_alert,
        },
        additional_invoice_emails: Array.isArray(additionalInvoiceEmails)
          ? additionalInvoiceEmails
          : sub.additional_invoice_emails,
        updated_at: new Date().toISOString(),
      }));
      return { data: updated };
    },
  });
}
