import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/** Rough check: is the text already mostly Cyrillic (Russian/Ukrainian)? */
function isMostlyCyrillic(text: string): boolean {
  const letters = text.match(/[a-zA-Zа-яА-ЯёЁ]/g) ?? [];
  if (letters.length === 0) return false;
  const cyrillic = text.match(/[а-яА-ЯёЁ]/g) ?? [];
  return cyrillic.length / letters.length > 0.5;
}

/** Translates a customer message to Russian for the Telegram notification. Never throws — returns null if translation isn't needed or fails. */
export async function translateToRussian(text: string): Promise<string | null> {
  if (!text.trim() || isMostlyCyrillic(text)) return null;

  try {
    const res = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      temperature: 0,
      system:
        'Translate the user message into natural, plain Russian. Reply with only the translation — no quotes, notes, or repeated original text.',
      messages: [{ role: 'user', content: text }],
    });
    const block = res.content.find((b) => b.type === 'text');
    return block && block.type === 'text' ? block.text.trim() : null;
  } catch (e) {
    console.error('[translate] request error:', e);
    return null;
  }
}
