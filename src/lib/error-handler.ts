import { NextResponse } from "next/server";

export async function sendDiscordAlert(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🚨 **HireFlow Alert**\n${message}`,
      }),
    });
  } catch (e) {
    console.error("Failed to send Discord alert:", e);
  }
}

type RouteHandler = (
  req: Request,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function apiHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`API Error [${req.method} ${req.url}]:`, error);

      await sendDiscordAlert(
        `**API Error**\n**Route:** ${req.method} ${req.url}\n**Error:** ${message}`
      );

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
