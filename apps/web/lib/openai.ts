import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '';
const baseURL = process.env.OPENAI_BASE_URL; // e.g. https://openrouter.ai/api/v1
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
  defaultHeaders: baseURL?.includes('openrouter.ai')
    ? {
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Stylus CRM',
      }
    : undefined,
});

export interface SuggestedAction {
  type: 'CREATE_ORDER' | 'UPDATE_STOCK' | 'NONE';
  items?: { productName: string; quantity: number }[];
}

export interface AnalysisResult {
  intent: 'INQUIRE_PRODUCT' | 'PLACE_ORDER' | 'CHECK_STOCK' | 'OTHER';
  extractedCustomerName?: string;
  proposedReply: string;
  proposedActions: SuggestedAction[];
}

/**
 * Analyzes incoming message context and returns structured suggestions.
 */
export async function analyzeIncomingMessage(
  messageContent: string,
  history: { content: string; sender: string }[],
  catalog: { name: string; sku: string | null; price: number; stock: number }[]
): Promise<AnalysisResult> {
  const catalogContext = catalog
    .map((p) => `- Name: "${p.name}", SKU: "${p.sku || 'N/A'}", Price: $${p.price}, Stock: ${p.stock}`)
    .join('\n');

  const historyContext = history
    .map((m) => `[${m.sender}] ${m.content}`)
    .join('\n');

  const systemPrompt = `You are an AI Sales Assistant for a WhatsApp vendor. Your job is to analyze the customer's incoming message, understand their intent, extract relevant order details, and propose the next action and draft reply.

Product Catalog:
${catalogContext}

Conversation History (recent messages first):
${historyContext}

Your response MUST be a JSON object matching this structure:
{
  "intent": "INQUIRE_PRODUCT" | "PLACE_ORDER" | "CHECK_STOCK" | "OTHER",
  "extractedCustomerName": "Name or null",
  "proposedReply": "A helpful, natural-sounding response draft in the conversation's language.",
  "proposedActions": [
    {
      "type": "CREATE_ORDER" | "NONE",
      "items": [
        { "productName": "Match one product EXACTLY from the catalog name list", "quantity": 1 }
      ]
    }
  ]
}

Rules:
1. ONLY draft a "CREATE_ORDER" action if the user is explicitly placing an order, buying, or requesting to lock items.
2. Ensure the "productName" field matches the catalog name EXACTLY. Do not use abbreviations or modify spelling.
3. If products are out of stock, politely draft a response explaining this and set the action to "NONE".
4. Do not include pricing logic in the actions; the server will calculate totals programmatically.
5. Provide the output strictly as a JSON object, without markdown formatting blocks.`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze incoming message: "${messageContent}"` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content) as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing message with OpenAI:', error);
    return {
      intent: 'OTHER',
      proposedReply: "I'm sorry, I encountered an issue processing your request. Let me double-check that with the vendor.",
      proposedActions: [{ type: 'NONE' }],
    };
  }
}
