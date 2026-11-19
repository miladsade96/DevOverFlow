import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/lib/server/user-sync";

export async function POST(req: Request) {
  const secret =
    process.env.CLERK_WEBHOOK_SECRET || process.env.NEXT_CLERK_WEBHOOK_SECRET;
  if (!secret)
    return new Response("Webhook is not configured.", { status: 503 });
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature)
    return new Response("Missing signature.", { status: 400 });
  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(await req.text(), {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }
  try {
    await syncClerkUser(event);
    return Response.json({ received: true });
  } catch {
    console.error("Clerk webhook could not be processed.");
    return new Response("Please retry this event.", { status: 500 });
  }
}
