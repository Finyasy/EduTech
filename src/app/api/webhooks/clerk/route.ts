import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { getPrisma } from "@/lib/server/prisma";
import {
  toDatabaseFailureResponse,
  withRouteTimeout,
} from "@/lib/server/request";

const parseEmailList = (rawList: string) =>
  rawList
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const getRoleForEmail = (email: string) => {
  const normalizedEmail = email.toLowerCase();
  if (parseEmailList(process.env.ADMIN_EMAILS ?? "").includes(normalizedEmail)) {
    return "ADMIN" as const;
  }
  if (parseEmailList(process.env.TEACHER_EMAILS ?? "").includes(normalizedEmail)) {
    return "TEACHER" as const;
  }
  return "STUDENT" as const;
};

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch {
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 },
    );
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const primaryEmail =
    event.data.email_addresses.find(
      (email) => email.id === event.data.primary_email_address_id,
    )?.email_address ?? event.data.email_addresses[0]?.email_address;

  if (!primaryEmail) {
    return NextResponse.json(
      { error: "Webhook user has no email address" },
      { status: 400 },
    );
  }

  const displayName =
    [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
    null;

  try {
    await withRouteTimeout(
      prisma.user.upsert({
        where: { id: event.data.id },
        update: {
          email: primaryEmail,
          name: displayName,
          role: getRoleForEmail(primaryEmail),
        },
        create: {
          id: event.data.id,
          email: primaryEmail,
          name: displayName,
          role: getRoleForEmail(primaryEmail),
        },
      }),
      "clerk webhook user sync",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, "clerk-webhook-user-sync");
  }

  revalidateTag(`user:${event.data.id}`, { expire: 0 });

  return NextResponse.json({ ok: true });
}
