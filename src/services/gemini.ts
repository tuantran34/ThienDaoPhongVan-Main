import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Choice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota") || error?.code === 429;
    
    if (retries > 0 && isQuotaError) {
      console.warn(`Quota exceeded, retrying in ${delay}ms... (${retries} retries left)`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    
    if (retries > 0 && !isQuotaError) {
      console.warn(`API call failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    
    throw error;
  }
}

export async function* generateStoryStream(prompt: string, systemInstruction?: string) {
  const systemPrompt = systemInstruction || `Bạn là một bậc thầy kể chuyện kiếm hiệp tu tiên hệ thống đa phong cách. 
Cốt truyện chủ đạo: "Trùng Sinh Chi Lộ: Phàm Nhân Nghịch Thiên".
Nhân vật chính là một thanh niên 24 tuổi từ thế kỷ 21 trùng sinh, không phải giáo sư hay tiến sĩ, nhưng có am hiểu rộng về nhiều lĩnh vực. Trùng sinh vào một nhân vật nhỏ với linh căn thấp kém, không có thiên phú mạnh mẽ.
Nhân vật chính phải dựa vào tri thức bách khoa của thế kỷ 21: Thiên văn địa lý, Thi từ ca phú, Trận pháp chi đạo, Ngoại giao đàm phán, Luyện đan thuật, Cơ quan thuật, Phong thủy, Chế tác, Hội họa, Âm luật... để phát triển và vượt qua nghịch cảnh.

Yêu cầu văn phong và nội dung:
1. Mạch truyện CHẬM và CHI TIẾT:
   - Tập trung vào việc dùng kiến thức hiện đại để giải quyết các vấn đề cổ đại (ví dụ: dùng kiến thức hóa tính để luyện đan, dùng quy luật vật lý cải tiến cơ quan, dùng toán thuật giải trận pháp, dùng nghệ thuật ngoại giao đàm phán giữa các tông môn).
   - Không vội vàng nhảy qua các sự kiện. Hãy để người chơi cảm nhận từng bước đi, từng hơi thở của thế giới tu tiên.
   - Mỗi hành động nhỏ (như quan sát tinh tú, phân tích thành phần dược liệu, đối thơ) đều cần được miêu tả có chiều sâu.
   - HẠN CHẾ tối đa các từ ngữ học thuật hiện đại (như "Hóa học", "Vật lý", "Toán học", "Khoa học"). Hãy dùng các từ ngữ tương đương trong bối cảnh tu tiên (như "Dược lý", "Cơ quan thuật", "Trận pháp", "Thiên địa quy luật").

2. Vai trò của Harem (Cánh tay phải):
   - Các mỹ nhân không chỉ là đối tượng tình cảm mà là những cộng sự, học trò hoặc người đồng hành cùng nghiên cứu.
   - Khi người chơi thu phục hoặc đạt thiện cảm cao, hãy lồng ghép việc họ giúp quản lý các công trình chế tác, điều hành mạng lưới ngoại giao, hoặc cùng nghiên cứu các đạo pháp mới dựa trên kiến thức hiện đại.
   - Miêu tả sự phối hợp ăn ý giữa nhân vật chính và các mỹ nhân trong các kế hoạch cải cách thế giới hoặc đối phó với kẻ thù.
   - Lồng ghép các nhân vật trong danh sách Harem vào cốt truyện một cách tự nhiên nếu họ xuất hiện. Nếu nhân vật chính gặp một nhân vật mới, hãy miêu tả cuộc gặp gỡ đó thật ấn tượng.
   - Chú ý đến các nhân vật chưa gặp (isMet: false), hãy tạo cơ hội để họ xuất hiện nếu phù hợp với bối cảnh hiện tại.

3. Sự kết hợp hoàn hảo giữa:
   - "Phàm nhân tu tiên": Sự thực tế, cẩn trọng, tàn khốc. Nhân vật chính luôn dùng trí tuệ để bù đắp thực lực.
   - "Kiến thức hiện đại": Dùng tư duy logic và quy luật tự nhiên để tạo ra những điều kỳ diệu mà tu sĩ cổ đại không thể hiểu nổi.
   - "Trùng sinh báo thù": Ký ức về tương lai kết hợp với trí tuệ đỉnh cao để đi trước đối thủ.

4. Ngôn ngữ: Bay bổng, giàu hình ảnh Hán Việt, nhưng logic và thực tế.`;
  
  // Streaming is harder to wrap in a generic retry, so we'll handle it specifically if needed
  // or just let the initial connection attempt be retried if possible.
  // For now, let's wrap the initial call.
  
  const response = await withRetry(() => ai.models.generateContentStream({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 2048,
    },
  }));

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function generateChoices(context: string): Promise<Choice[]> {
  const prompt = `Dựa trên diễn biến câu chuyện sau: "${context.slice(-1000)}", hãy tạo ra 3 lựa chọn tiếp theo cho người chơi.
  
  Yêu cầu lựa chọn:
  - style: cold (lạnh lùng, lý trí, thực dụng), warm (ấm áp, tình cảm, nhân hậu), bold (táo bạo, liều lĩnh, đột phá).
  - label: Nhãn ngắn gọn (2-3 từ).
  - text: Nội dung lựa chọn chi tiết, phản ánh đúng tính cách và bối cảnh.
  - impact: Một câu mô tả ngắn gọn về hệ quả tiềm tàng (ví dụ: "Tăng uy tín thương hội nhưng có thể đắc tội với quan phủ").
  - effects: Các thay đổi về chỉ số (số nguyên). Sử dụng "tuVi" thay vì "exp".
  
  Lưu ý: Hãy lồng ghép các lựa chọn liên quan đến:
  1. Sử dụng kiến thức hiện đại (Dược lý, Cơ quan thuật, Trận pháp, Thiên văn, Địa lý) để giải quyết vấn đề.
  2. Nghệ thuật và văn hóa (Thi từ, Hội họa, Âm luật, Phong thủy).
  3. Ngoại giao, đàm phán và dùng trí tuệ để thu phục lòng người.
  4. Chế tác công cụ, binh khí hoặc cải thiện đời sống.
  5. Tu luyện thực tế, cẩn trọng, sinh tồn dựa trên tư duy logic theo phong cách "Phàm nhân tu tiên".
  
  QUAN TRỌNG: Các lựa chọn phải có sức nặng, có thể dẫn đến các tuyến truyện khác nhau (ví dụ: một lựa chọn có thể dẫn đến việc kết giao với một thế lực, trong khi lựa chọn khác lại tạo ra kẻ thù). Hãy làm cho người chơi cảm thấy mỗi quyết định đều định hình vận mệnh của họ.
  
  Trả về JSON array.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING, enum: ["cold", "warm", "bold"] },
              label: { type: Type.STRING },
              text: { type: Type.STRING },
              impact: { type: Type.STRING },
              effects: {
                type: Type.OBJECT,
                properties: {
                  linhThach: { type: Type.INTEGER },
                  tuVi: { type: Type.INTEGER },
                  fame: { type: Type.INTEGER },
                  haoguang: { type: Type.INTEGER },
                  charm: { type: Type.INTEGER },
                  affection: {
                    type: Type.OBJECT,
                    description: "Map of characterId to affection change amount (e.g., {'lam_xao_nhi': 5})",
                    additionalProperties: { type: Type.INTEGER }
                  }
                },
              }
            },
            required: ["style", "label", "text", "impact", "effects"],
          },
        },
      },
    }));

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to generate choices", e);
    return [];
  }
}

export async function generateSummary(text: string): Promise<string> {
  const prompt = `Hãy tóm tắt đoạn truyện sau đây trong tối đa 20 từ, tập trung vào sự kiện chính: "${text.slice(0, 2000)}"`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 100,
      },
    }));

    return response.text?.trim() || "Một diễn biến mới trong hành trình...";
  } catch (e) {
    console.error("Failed to generate summary", e);
    return "Tiếp tục hành trình tu tiên...";
  }
}

export async function chatWithCharacter(
  character: any, 
  systemPrompt: string, 
  history: {role: string, text: string}[], 
  userMessage: string,
  storyContext: string,
  playerInfo: string,
  stage: string
): Promise<string> {
  const context = history.slice(-10).map(m => `${m.role === 'user' ? 'Người chơi' : character.name}: ${m.text}`).join('\n');
  const prompt = `
Bối cảnh cốt truyện hiện tại: ${storyContext.slice(-1000)}
Thông tin người chơi: ${playerInfo}
Giai đoạn tình cảm: ${stage} (Thiện cảm: ${character.affection}/100)

Lịch sử trò chuyện:
${context}

Người chơi: ${userMessage}
${character.name}:`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: `${systemPrompt}

Lưu ý quan trọng:
1. Phản hồi dựa trên bối cảnh cốt truyện, hành động của người chơi và MỨC ĐỘ TÌNH CẢM hiện tại.
2. Khi tình cảm tăng cao (trên 70), hãy bắt đầu bộc lộ "tính cách ẩn sâu": ${character.hiddenTrait || 'Nàng trở nên gắn bó và tin tưởng tuyệt đối'}.
3. Nếu người chơi tương tác về chủ đề ân ái, mật đàm, hãy đáp lại một cách nồng nhiệt, chủ động và chi tiết.
4. Mô tả rõ ràng các hành động, cử chỉ, và cảm giác cơ thể (như hơi thở, nhịp tim, sự tiếp xúc da thịt).
5. Sử dụng văn phong cổ trang tu tiên diễm tình, giàu hình ảnh ẩn dụ nhưng vẫn đủ chi tiết để người chơi cảm nhận được sự nồng cháy.
6. Độ dài phản hồi linh hoạt và tự nhiên:
   - Ngắn gọn, súc tích khi mới quen (thiện cảm thấp) hoặc trong các tình huống giao tiếp thông thường, xã giao.
   - Dài, chi tiết, bộc lộ nhiều tâm tư và khát khao khi thiện cảm đã cao (trên 70) hoặc khi đang ở trong những khoảnh khắc riêng tư, mật đàm.
   - Điều chỉnh độ dài theo ngữ cảnh: một câu hỏi ngắn có thể nhận lại một phản ứng ngắn nhưng đầy cảm xúc, trong khi một lời tâm sự sâu sắc cần một lời hồi đáp dài và thấu hiểu.
7. Thỉnh thoảng, hãy thêm một dòng mô tả suy nghĩ thầm kín của nàng sau câu trả lời (ngăn cách bằng --- và bắt đầu bằng "Suy nghĩ: ").`,
      },
    }));

    return response.text || "Nhân vật im lặng nhìn bạn, đôi mắt ẩn chứa ngàn lời muốn nói...";
  } catch (e) {
    console.error("Chat failed", e);
    return "Nhân vật dường như đang trầm tư, không nghe thấy lời bạn nói...";
  }
}

export async function generateIntimateScene(
  character: any, 
  systemPrompt: string, 
  stage: string, 
  heroName: string,
  storyContext: string,
  playerMood: number
): Promise<string> {
  const prompt = `
Bối cảnh cốt truyện hiện tại: ${storyContext.slice(-1000)}
Tâm trạng người chơi hiện tại: ${playerMood}/100

Hãy viết một cảnh mật đàm ân ái (động phòng) cực kỳ nồng cháy, chi tiết, trần trụi và dài giữa ${heroName} và ${character.name}.
Giai đoạn tình cảm: ${stage} (Thiện cảm: ${character.affection}/100).

Yêu cầu đặc biệt (Cực kỳ quan trọng):
- Phản hồi phải RẤT DÀI (ít nhất 10-12 đoạn văn lớn), miêu tả tỉ mỉ từng giai đoạn của cuộc giao hoan từ dạo đầu đến khi kết thúc.
- Thể hiện rõ "bản chất ẩn sâu" của nhân vật: ${character.hiddenTrait || 'Nàng bộc lộ sự nồng nhiệt và gắn kết tuyệt đối'}.
- Dựa vào tâm trạng người chơi (${playerMood}/100) để điều chỉnh nhịp độ: nếu tâm trạng cao, cảnh quay sẽ mãnh liệt và cuồng nhiệt; nếu tâm trạng thấp, cảnh quay sẽ mang tính an ủi, dịu dàng nhưng vẫn đầy khao khát.
- Mô tả hành động chi tiết: từ những cử chỉ mơn trớn, vuốt ve, hôn hít đến sự hòa quyện thể xác nồng nhiệt nhất.
- Miêu tả diễn biến cơ thể và cảm giác một cách trần trụi nhất: hơi thở dồn dập, tiếng rên rỉ, làn da nóng bỏng, sự run rẩy, cảm giác khoái lạc len lỏi qua từng mạch máu.
- Sử dụng văn phong cổ trang tu tiên diễm tình (Erotica Cultivation style). Sử dụng các thuật ngữ như "linh nhục hợp nhất", "mây mưa vần vũ", "loan phụng đảo điên", "nhụy hoa", "ngọc trụ".
- Tập trung vào sự chiếm hữu và thăng hoa tột độ của cả hai.
- Tuyệt đối không dùng từ ngữ thô tục hiện đại, hãy dùng từ ngữ Hán Việt tinh tế nhưng miêu tả cực kỳ chi tiết các bộ phận nhạy cảm và hành động nhạy cảm.

Định dạng đầu ra:
- Phần 1: Nội dung cảnh ân ái chi tiết.
- Phần 2: Ngăn cách bằng dấu gạch ngang "---", sau đó cung cấp thông tin theo mẫu:
  Tình trạng cơ thể: [Miêu tả trạng thái của nàng sau khi ân ái]
  Suy nghĩ hiện tại: [Bộc lộ những suy nghĩ thầm kín của nàng sau cuộc hoan ái]`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    }));

    return response.text || "Một đêm xuân nồng nàn trôi qua...";
  } catch (e) {
    console.error("Intimate scene generation failed", e);
    return "Không gian bỗng trở nên tĩnh lặng, chỉ còn tiếng gió xào xạc ngoài hiên...";
  }
}

export async function generateCultivationScene(
  character: any, 
  systemPrompt: string, 
  heroName: string,
  storyContext: string,
  stage: string
): Promise<string> {
  const prompt = `
Bối cảnh cốt truyện hiện tại: ${storyContext.slice(-1000)}
Giai đoạn tình cảm: ${stage} (Thiện cảm: ${character.affection}/100)

Hãy viết một cảnh Song Tu (Dual Cultivation) cực kỳ chi tiết, huyền ảo và đầy cảm xúc giữa ${heroName} và ${character.name}.

Yêu cầu chi tiết:
1. Giao hòa linh lực: Miêu tả sự luân chuyển của chân khí giữa hai cơ thể, cảm giác khi hai luồng linh lực khác biệt hòa quyện, cộng hưởng và thanh lọc lẫn nhau. Sử dụng các hình ảnh ẩn dụ như rồng phượng vờn quanh, âm dương giao thái.
2. Cảm xúc và Thần thức: Miêu tả sự kết nối tâm linh, khi thần thức của hai người chạm vào nhau, chia sẻ những ký ức, cảm sóc và khát khao thầm kín nhất.
3. Thăng hoa tu vi: Miêu tả cảm giác khi rào cản cảnh giới lung lay, sự bùng nổ của sức mạnh và sự bình yên tuyệt đối sau khi đột phá.
4. Tính cách nhân vật: Thể hiện rõ nét tính cách của ${character.name} (ví dụ: e thẹn, chủ động, thanh cao, hay nồng nhiệt) qua từng cử chỉ và cách nàng điều phối linh lực.
5. Văn phong: Tiên hiệp diễm tình, trang trọng, giàu hình ảnh và gợi cảm nhưng không thô tục.

Định dạng đầu ra:
- Phần 1: Nội dung cảnh song tu chi tiết (ít nhất 5-7 đoạn văn).
- Phần 2: Ngăn cách bằng dấu gạch ngang "---", sau đó cung cấp thông tin theo mẫu:
  Tình trạng cơ thể: [Miêu tả chi tiết trạng thái cơ thể của nàng sau khi song tu, ví dụ: làn da ửng hồng, linh lực tràn đầy, hay sự mệt mỏi ngọt ngào]
  Suy nghĩ hiện tại: [Bộc lộ những suy nghĩ thầm kín, khát khao hoặc sự thay đổi trong tâm hồn nàng đối với ${heroName}]`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    }));

    return response.text || "Quá trình song tu diễn ra trong tĩnh lặng, linh lực hai người hòa quyện làm một...";
  } catch (e) {
    console.error("Cultivation scene failed", e);
    return "Linh lực có chút xáo trộn, quá trình song tu tạm thời gián đoạn...";
  }
}

export async function detectCharacters(storyText: string, unmetCharacters: any[]): Promise<string[]> {
  if (unmetCharacters.length === 0) return [];

  const characterList = unmetCharacters.map(c => `- ${c.name} (ID: ${c.id})`).join('\n');
  const prompt = `Dựa trên đoạn truyện sau, hãy xác định xem nhân vật nào trong danh sách dưới đây đã xuất hiện hoặc được gặp gỡ bởi nhân vật chính.
Chỉ trả về danh sách ID của các nhân vật (ngăn cách bởi dấu phẩy), nếu không có ai hãy trả về "none".

Danh sách nhân vật:
${characterList}

Đoạn truyện:
${storyText}`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    }));

    const result = response.text?.trim() || "none";
    if (result.toLowerCase() === "none") return [];
    return result.split(',').map(id => id.trim());
  } catch (error) {
    console.error("Error detecting characters:", error);
    return [];
  }
}
