import type { HandlerResult } from "./_base.js";

export async function execute(config: Record<string, unknown>): Promise<HandlerResult> {
  const channel = String(config.channel ?? "log");
  const message = String(config.message ?? "");

  // Discord webhook
  if (channel === "discord" && process.env.DISCORD_WEBHOOK_URL) {
    try {
      const resp = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      return {
        output: { channel, message, sentAt: new Date().toISOString(), status: resp.ok ? "delivered" : "failed" },
      };
    } catch (err) {
      return { output: { channel, message, error: String(err), status: "failed" } };
    }
  }

  // Fallback: log to console and return success
  console.log(`[Notification] [${channel}] ${message}`);
  return {
    output: { channel, message, sentAt: new Date().toISOString(), status: "delivered", note: channel === "discord" ? "Set DISCORD_WEBHOOK_URL to send to Discord" : undefined },
  };
}
