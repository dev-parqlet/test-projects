"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { mutateById } from "@/lib/mock-subscription-store";

export async function PUT(request: NextRequest) {
  return handleRequest(request, "/api/subscription/billing-info", {
    mockFactoryWithBody: (body) => {
      const { subscriptionId, billingAddress } = body as {
        subscriptionId: string;
        billingAddress: { company: string; email: string; taxId: string };
      };
      const updated = mutateById(subscriptionId, (sub) => ({
        ...sub,
        billing_address: {
          company: billingAddress.company,
          email: billingAddress.email,
          tax_id: billingAddress.taxId ?? "",
        },
        updated_at: new Date().toISOString(),
      }));
      return { data: updated };
    },
  });
}
