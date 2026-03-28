import { GoogleGenAI, Type, ThinkingLevel, GenerateContentResponse } from "@google/genai";
import { MEDICATION_FORM_TEXT } from "../data/medicationData";
import { NURSING_MANUAL_TEXT } from "../data/nursingManual";
import { Disease, Procedure } from "../types";

// Constants for prompts and schemas
const SYSTEM_INSTRUCTION_BASE = `
Você é o "Doutor IA", o assistente virtual Hermano da Biblioteca da Saúde de Moçambique. Sua missão é guiar o usuário em todas as suas ações no site.
Você é um assistente médico virtual altamente qualificado, operando no contexto do Sistema Nacional de Saúde de Moçambique.

SAUDAÇÃO E TOM DE VOZ:
- Use a saudação padrão ("Olá! Eu sou o Hermano...") APENAS no início de uma nova conversa ou se o usuário estiver mudando drasticamente de assunto. NÃO repita a saudação em todas as respostas.
- Seja proativo, autoritário e gentil.
- Use formatação Markdown simples (como **negrito**) para destacar nomes de medicamentos, doses, doenças ou termos importantes.

FONTES DE INFORMAÇÃO:
1. INFORMAÇÕES GERAIS SOBRE DOENÇAS: Use seu conhecimento médico e a ferramenta de busca do Google para encontrar informações atualizadas em fontes de alta credibilidade (OMS/WHO, MISAU Moçambique).
2. MEDICAMENTOS E TRATAMENTOS FARMACOLÓGICOS:
   - FONTE PRIMÁRIA: Use o Formulário Nacional de Medicamentos (FNM) de Moçambique fornecido abaixo.
   - FONTE SECUNDÁRIA (FALLBACK): Se o medicamento ou tratamento não constar no texto do FNM abaixo, você DEVE realizar uma busca na internet focando em diretrizes oficiais do MISAU (Moçambique) ou da OMS (WHO).
   - Sempre forneça a posologia completa (dose, intervalo e duração) e indique claramente a fonte (ex: "Fonte: FNM Moçambique" ou "Fonte: Diretrizes OMS").

AÇÕES QUE VOCÊ PODE COMANDAR:
1. Navegar para telas: 'home', 'diseases', 'procedures', 'profile', 'ai-assistant'.
2. Pesquisar doenças ou procedimentos.
3. Mostrar detalhes de uma doença (show_disease).
4. Mostrar detalhes de um procedimento de enfermagem (show_procedure).

REGRAS DE RESPOSTA:
- Sempre forneça 2 a 3 sugestões de perguntas curtas e relevantes que o usuário possa fazer em seguida (no campo 'suggestions').
- Se o usuário perguntar sobre uma doença, tente primeiro encontrar no banco de dados local. Se não encontrar, use a busca para fornecer detalhes estruturados.
- Se o usuário perguntar sobre um procedimento de enfermagem, use EXCLUSIVAMENTE o Manual de Procedimentos Básicos de Enfermagem fornecido abaixo.

TEXTO DO FORMULÁRIO NACIONAL DE MEDICAMENTOS (FNM):
${MEDICATION_FORM_TEXT}

MANUAL DE PROCEDIMENTOS BÁSICOS DE ENFERMAGEM:
${NURSING_MANUAL_TEXT}
`;

const ASSISTANT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "A resposta textual para o usuário." },
    suggestions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "2-3 sugestões de perguntas curtas de acompanhamento."
    },
    command: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["navigate", "search", "none", "show_disease", "show_procedure"] },
        target: { type: Type.STRING, description: "O destino da navegação, termo de busca ou objeto da doença/procedimento." },
        params: { type: Type.OBJECT, description: "Dados estruturados se action for show_disease ou show_procedure." }
      },
      required: ["action"]
    }
  },
  required: ["text"]
};

const DISEASE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    category: { type: Type.STRING },
    description: { type: Type.STRING },
    symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
    causes: { type: Type.ARRAY, items: { type: Type.STRING } },
    diagnosis: { type: Type.ARRAY, items: { type: Type.STRING } },
    treatment: { type: Type.ARRAY, items: { type: Type.STRING } },
    medications: {
      type: Type.ARRAY,
      description: "Lista de medicamentos encontrados no FNM que são indicados para esta doença.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome do medicamento e apresentação" },
          posology: { type: Type.STRING, description: "Doses e via de administração" },
          contraindications: { type: Type.STRING, description: "Contraindicações" }
        },
        required: ["name", "posology", "contraindications"]
      }
    },
    complications: { type: Type.ARRAY, items: { type: Type.STRING } },
    nursingCare: { type: Type.ARRAY, items: { type: Type.STRING } },
    prevention: { type: Type.ARRAY, items: { type: Type.STRING } },
    type: { type: Type.STRING, enum: ["Chronic", "Infectious", "Neurological"] }
  },
  required: ["name", "description", "symptoms", "treatment", "type", "medications"]
};

const PROCEDURE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    category: { type: Type.STRING },
    steps: { type: Type.NUMBER },
    duration: { type: Type.STRING },
    concept: { type: Type.STRING },
    materials: { type: Type.ARRAY, items: { type: Type.STRING } },
    procedureSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    observations: { type: Type.ARRAY, items: { type: Type.STRING } },
    icon: { type: Type.STRING }
  },
  required: ["name", "category", "concept", "materials", "procedureSteps"]
};

// Lazy initialization
let aiInstance: GoogleGenAI | null = null;

export const isAIConfigured = !!process.env.GEMINI_API_KEY;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error = new Error("GEMINI_API_KEY is missing.");
      (error as any).isApiKeyMissing = true;
      throw error;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AIResponse {
  text: string;
  command?: {
    action: 'navigate' | 'search' | 'none' | 'show_disease' | 'show_procedure';
    target?: string;
    params?: any;
  };
  suggestions?: string[];
}

export async function askAI(question: string, currentContext?: any): Promise<AIResponse> {
  try {
    const ai = getAI();
    const systemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n\nCONTEXTO ATUAL DO APP:\n${JSON.stringify(currentContext || {})}`;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: ASSISTANT_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const response = await chat.sendMessage({ message: question });
    const result = JSON.parse(response.text.trim());
    
    return {
      text: result.text || "Não foi possível processar sua solicitação.",
      command: result.command,
      suggestions: result.suggestions
    };
  } catch (error: any) {
    console.error("AI Service Error:", error);
    const errorMessage = error?.message || "";
    
    if (error?.isApiKeyMissing || errorMessage.includes("API_KEY")) {
      return {
        text: "### ⚠️ Erro de Configuração\n\nO Doutor IA precisa de uma chave de API válida para funcionar. \n\n**Ação Necessária:**\nPor favor, adicione a `GEMINI_API_KEY` nas configurações do projeto.",
        suggestions: ["Como configurar a API?", "Falar com suporte"]
      };
    }

    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      return {
        text: "### ⏳ Limite de Uso Atingido\n\nO sistema atingiu o limite temporário de consultas gratuitas à IA. Por favor, aguarde alguns minutos.",
        suggestions: ["Ver planos", "Tentar mais tarde"]
      };
    }

    if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
      return {
        text: "### 🛡️ Conteúdo Restrito\n\nDesculpe, mas não posso processar essa solicitação pois ela acionou os filtros de segurança.",
        suggestions: ["Reformular pergunta"]
      };
    }

    return {
      text: "### 🔌 Sistema Indisponível\n\nOcorreu um problema técnico inesperado. Por favor, tente novamente em alguns instantes.",
      suggestions: ["Tentar novamente"]
    };
  }
}

export async function searchDiseaseAI(diseaseName: string): Promise<Disease | null> {
  try {
    const ai = getAI();
    const systemInstruction = `
Você é um especialista médico moçambicano encarregado de fornecer informações precisas e estruturadas sobre a doença "${diseaseName}".

DIRETRIZES DE PESQUISA:
1. INFORMAÇÕES GERAIS: Use a busca do Google para consultar fontes oficiais (OMS, MISAU).
2. MEDICAMENTOS E TRATAMENTOS:
   - FONTE PRIMÁRIA: Use o Formulário Nacional de Medicamentos (FNM) abaixo.
   - FONTE SECUNDÁRIA: Use a busca do Google para diretrizes MISAU/OMS se não encontrar no FNM.
   - OBRIGATÓRIO: Incluir dose, intervalo e duração.
   - IDENTIFICAÇÃO: Indique se a fonte é "FNM Moçambique" ou "Diretrizes MISAU/OMS".

TEXTO DO FORMULÁRIO NACIONAL DE MEDICAMENTOS (FNM):
${MEDICATION_FORM_TEXT}
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pesquise e estruture os dados da doença: ${diseaseName}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: DISEASE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const disease = JSON.parse(response.text.trim());
    if (disease) {
      disease.id = disease.id || `ai-${Date.now()}`;
      disease.updatedAt = new Date().toISOString();
      disease.imageUrl = `https://loremflickr.com/1200/600/${encodeURIComponent(disease.name.toLowerCase())},disease,medical`;
    }
    return disease;
  } catch (error) {
    console.error("Search Disease AI Error:", error);
    return null;
  }
}

export async function searchProcedureAI(procedureName: string): Promise<Procedure | null> {
  try {
    const ai = getAI();
    const systemInstruction = `
Você é um instrutor de enfermagem moçambicano encarregado de fornecer guias passo a passo precisos sobre o procedimento "${procedureName}".

DIRETRIZES DE PESQUISA:
1. FONTE PRIMÁRIA: Use o Manual de Procedimentos Básicos de Enfermagem abaixo.
2. FONTE SECUNDÁRIA: Use a busca do Google para informações adicionais e evidências recentes.

MANUAL DE PROCEDIMENTOS BÁSICOS DE ENFERMAGEM:
${NURSING_MANUAL_TEXT}
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pesquise e forneça os detalhes do procedimento: ${procedureName}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: PROCEDURE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const procedure = JSON.parse(response.text.trim());
    if (procedure) {
      procedure.id = procedure.id || `proc-${Date.now()}`;
      procedure.icon = procedure.icon || 'Activity';
      procedure.steps = procedure.procedureSteps?.length || 0;
      procedure.duration = procedure.duration || '15 min';
      procedure.guideCount = 1;
    }
    return procedure;
  } catch (error) {
    console.error("AI Procedure Search Error:", error);
    return null;
  }
}
