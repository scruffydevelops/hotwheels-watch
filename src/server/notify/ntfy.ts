// ntfy.sh — free, no-signup push notifications. Anyone who knows the topic
// name can publish to or subscribe to it (topics are public unless you
// self-host with auth), so the topic name is generated randomly and never
// guessable.
const NTFY_ORIGIN = "https://ntfy.sh";

export interface NtfyMessage {
  title?: string;
  message: string;
  priority?: 1 | 2 | 3 | 4 | 5; // 5 = urgent
  click?: string; // URL to open when the notification itself is tapped
  // Emoji shortcodes (ntfy renders these as icons in the notification, e.g.
  // "rotating_light"). ntfy has no per-message sound field — sound is
  // controlled by the receiving app's per-priority notification channel —
  // so priority is what actually determines whether it makes noise.
  tags?: string[];
}

export async function sendNtfy(topic: string, { title, message, priority, click, tags }: NtfyMessage) {
  // Publish via JSON body, not headers — HTTP headers can only carry Latin-1
  // text, so a title/message with an em-dash, ₹, emoji, etc. (all of which we
  // use) breaks header-based publishing. The JSON endpoint handles UTF-8 fine.
  const res = await fetch(NTFY_ORIGIN, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topic, title, message, priority, click, tags }),
  });
  if (!res.ok) throw new Error(`ntfy send failed: ${res.status}`);
}

export function generateTopicName(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `hotwheels-watch-${random}`;
}
