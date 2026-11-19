/**
 * Claude / Anthropic API client for AI-powered PDF tools.
 *
 * Works with the official Anthropic API (https://api.anthropic.com) or any
 * Anthropic-compatible third-party gateway / proxy (set ANTHROPIC_BASE_URL).
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY    - required for AI features (Summarizer, Translate, Markdown)
 *   ANTHROPIC_BASE_URL   - optional, defaults to https://api.anthropic.com
 *   ANTHROPIC_MODEL      - optional, defaults to claude-sonnet-4-5
 *
 * All helpers are defensive: if the key is missing or a call fails, the caller
 * is expected to catch the error and fall back to the local (offline) engine,
 * so the tools never hard-fail just because AI is unavailable.
 */

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_MODEL = 'claude-sonnet-4-5';

/** True when an API key is present (AI features can be attempted). */
export function isClaudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());
}

/** The model id to use (env override, else default). */
export function getClaudeModel() {
  return (process.env.ANTHROPIC_MODEL && process.env.ANTHROPIC_MODEL.trim()) || DEFAULT_MODEL;
}

/**
 * Call the Anthropic Messages API and return the assistant's text.
 *
 * @param {string} system  System prompt (role / behaviour instructions).
 * @param {string} user    User message (document text + task instruction).
 * @param {object} [opts]
 * @param {number} [opts.maxTokens=8000]   Max tokens for the completion.
 * @param {number} [opts.temperature=0.2]  Sampling temperature (low = deterministic).
 * @param {number} [opts.timeoutMs=90000]  Request timeout in ms.
 * @returns {Promise<string>} The assistant's plain-text response.
 * @throws {Error} If the key is missing, the request fails, or no text is returned.
 */
export async function claudeComplete(system, user, opts = {}) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Claude API is not configured. Set ANTHROPIC_API_KEY in .env to enable AI features.');
  }

  let baseUrl = (process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  // Avoid a doubled /v1 if the user already included it in the base URL.
  if (!/\/v\d+$/.test(baseUrl)) baseUrl += '/v1';
  const model = getClaudeModel();
  const maxTokens = opts.maxTokens || 8000;
  const temperature = opts.temperature ?? 0.2;
  const timeoutMs = opts.timeoutMs || 90000;

  const url = `${baseUrl}/messages`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
  } catch (netErr) {
    // Network error / timeout
    const isAbort = netErr.name === 'AbortError';
    throw new Error(isAbort ? 'Claude API request timed out.' : `Claude API network error: ${netErr.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // Surface a clean, user-friendly message for common failure modes.
    let friendly = `Claude API error ${res.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error && parsed.error.message) friendly = `Claude API error ${res.status}: ${parsed.error.message}`;
    } catch (e) {
      if (errText) friendly = `Claude API error ${res.status}: ${errText.slice(0, 200)}`;
    }
    throw new Error(friendly);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error('Claude API returned no text content.');
  }
  // Sanitize runaway token repetitions that can occur on certain proxy gateways or non-Latin scripts
  const sanitized = textBlock.text.replace(/(.{1,8}?)\1{6,}/gu, '').trim();
  return sanitized;
}
