import { StoryContext, StoryResponse } from "../types";
import { generateChoices, generateStoryStream } from "./gemini";

export interface AIProvider {
  generateStoryStep(context: StoryContext): Promise<StoryResponse>;
}

class GeminiProvider implements AIProvider {
  async generateStoryStep(context: StoryContext): Promise<StoryResponse> {
    const prompt = `Bối cảnh: ${context.currentStoryContext}. 
    Người chơi: ${context.heroName}. 
    Chỉ số: ${JSON.stringify(context.playerStats)}.
    Hãy viết tiếp câu chuyện.`;

    let content = "";
    for await (const chunk of generateStoryStream(prompt)) {
      content += chunk;
    }

    const choices = await generateChoices(content);

    return {
      content,
      choices,
    };
  }
}

class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  async generateStoryStep(context: StoryContext): Promise<StoryResponse> {
    return this.provider.generateStoryStep(context);
  }
}

// Default to Gemini
export const aiService = new AIService(new GeminiProvider());
