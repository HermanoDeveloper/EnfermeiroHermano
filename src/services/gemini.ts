import { GoogleGenAI } from "@google/genai";
import { MEDICATION_FORM_TEXT } from "../data/medicationData";

// Lazy initialization to avoid crash if key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function askAboutMedication(question: string) {
  try {
    const ai = getAI();
    const prompt = `
Você é um assistente médico especializado no Formulário Nacional de Medicamentos de Moçambique.
Use estritamente as informações abaixo para responder à pergunta do usuário.
Se a informação não estiver no texto, diga que não encontrou essa informação específica no formulário.

TEXTO DO FORMULÁRIO:
${MEDICATION_FORM_TEXT}

PERGUNTA DO USUÁRIO:
${question}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma resposta.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação de IA.";
  }
}
