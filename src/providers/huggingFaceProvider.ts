type HFMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function createHuggingFaceProvider() {
  const model = "meta-llama/Llama-3.1-8B-Instruct";
  const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
  const token = process.env.HF_TOKEN;
  const messages: HFMessage[] = [];

  async function init(initialPrompts: string) {
    messages.length = 0;

    messages.push({
      role: "system",
      content: initialPrompts,
    });

    return true;
  }

  function buildPrompt() {
    let prompt = "<|begin_of_text|>";
    for (const m of messages) {
      prompt += `<|start_header_id|>${m.role}<|end_header_id|>\n\n${m.content}<|eot_id|>`;
    }
    prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`;
    return prompt;
  }

  async function prompt(
    userMsg: string,
    signal?: AbortSignal,
  ): Promise<string> {
    messages.push({ role: "user", content: userMsg });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: buildPrompt(),
        parameters: {
          max_new_tokens: 512,
          return_full_text: false,
          stop: ["<|eot_id|>", "<|end_header_id|>"],
        },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Hugging Face: ${response.status}`);
    }

    const result = await response.json();
    const generatedText =
      result[0]?.generated_text || "[HF] Nenhuma resposta gerada.";

    messages.push({ role: "assistant", content: generatedText });
    return generatedText;
  }

  return { init, prompt };
}
