
import { OpenAI } from 'openai';

export interface LLMConfig {
    apiKey: string;
    baseURL?: string;
    model?: string;
}

export class LLMClient {
    private client: OpenAI;
    private model: string;

    constructor(config: LLMConfig) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
        this.model = config.model || 'gpt-4o';
    }

    async complete(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages,
        });

        return response.choices[0].message.content || '';
    }

    async completeJson<T>(prompt: string, systemPrompt?: string): Promise<T> {
        const response = await this.complete(
            prompt + "\n\nResponse must be valid JSON.",
            systemPrompt + "\n\nYou are a JSON generator. Output ONLY valid JSON."
        );

        try {
            // Clean up markdown code blocks if present
            const cleanJson = response.replace(/^```json\n/, '').replace(/\n```$/, '');
            return JSON.parse(cleanJson) as T;
        } catch (e) {
            throw new Error(`Failed to parse JSON response: ${response}`);
        }
    }
}
