// Server-side proxy for Claude. The browser never sees the API key.
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
const sdk = require("@anthropic-ai/sdk");
const Anthropic = sdk.default || sdk;

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 8000;
const MAX_INPUT_CHARS = 60000;

function sameOrigin(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const from = req.headers.origin || req.headers.referer;
  if (!from) return false;
  try { return new URL(from).host === host; } catch { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "Forbidden" });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { system, messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }
  if (JSON.stringify({ system, messages }).length > MAX_INPUT_CHARS) {
    return res.status(413).json({ error: "Request too large" });
  }
  // Thinking tokens count toward max_tokens, so use a fixed, roomy limit.
  const maxTokens = MAX_TOKENS;

  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      ...(system ? { system: String(system) } : {}),
      messages: messages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
    });
    if (msg.stop_reason === "refusal") {
      return res.status(200).json({ content: [], stop_reason: "refusal" });
    }
    const content = msg.content
      .filter(b => b.type === "text")
      .map(b => ({ type: "text", text: b.text }));
    return res.status(200).json({ content, stop_reason: msg.stop_reason });
  } catch (e) {
    const status = e && e.status ? e.status : 500;
    return res.status(status >= 400 && status < 600 ? status : 500)
      .json({ error: "Claude request failed", message: e && e.message });
  }
};
