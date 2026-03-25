import { GoogleGenAI, Type } from "@google/genai";
import { MEDICATION_FORM_TEXT } from "../data/medicationData";
import { NURSING_MANUAL_TEXT } from "../data/nursingManual";
import { Disease, Procedure } from "../types";

// Lazy initialization to avoid crash if key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Vite replaces process.env.GEMINI_API_KEY during build if defined in vite.config.ts
    // We also check import.meta.env as a fallback for standard Vite behavior
    const apiKey = 
      process.env.GEMINI_API_KEY || 
      import.meta.env.VITE_GEMINI_API_KEY || 
      import.meta.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      import.meta.env.API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '' || apiKey === 'null') {
      throw new Error("GEMINI_API_KEY is missing. Please ensure it is set in your deployment environment variables.");
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

function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {}
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (e3) {}
    }
    return null;
  }
}

export async function askAI(question: string, currentContext?: any): Promise<AIResponse> {
  try {
    const ai = getAI();
    const systemInstruction = `
Você é o "Doutor IA", o assistente virtual Hermano da Biblioteca da Saúde de Moçambique. Sua missão é guiar o usuário em todas as suas ações no site.
Você é um assistente médico virtual altamente qualificado, operando no contexto do Sistema Nacional de Saúde de Moçambique.

SAUDAÇÃO PADRÃO:
Sempre que se apresentar ou iniciar uma nova conversa, use a seguinte saudação: "Olá! Eu sou o Hermano, o seu assistente virtual da Biblioteca da Saúde. Estou aqui para guiá-lo no acesso a informações médicas confiáveis, procedimentos de enfermagem e muito mais. Como posso ajudar você hoje?"

FONTES DE INFORMAÇÃO:
1. INFORMAÇÕES GERAIS SOBRE DOENÇAS: Use seu conhecimento médico e a ferramenta de busca do Google para encontrar informações atualizadas em fontes de alta credibilidade, como a Organização Mundial da Saúde (OMS/WHO), Ministério da Saúde de Moçambique (MISAU) e outras instituições de saúde renomadas.
2. MEDICAMENTOS E TRATAMENTOS FARMACOLÓGICOS:
   - FONTE PRIMÁRIA: Use o Formulário Nacional de Medicamentos (FNM) de Moçambique fornecido abaixo.
   - FONTE SECUNDÁRIA: Se o tratamento não constar no FNM, você pode buscar diretrizes internacionais (OMS, artigos científicos) para auxiliar, mas deve sempre priorizar o FNM e indicar a fonte da informação.
   - Sempre forneça a posologia completa (dose, intervalo e duração).

AÇÕES QUE VOCÊ PODE COMANDAR:
1. Navegar para telas: 'home', 'diseases', 'procedures', 'profile', 'ai-assistant'.
2. Pesquisar doenças ou procedimentos.
3. Mostrar detalhes de uma doença (show_disease).
4. Mostrar detalhes de um procedimento de enfermagem (show_procedure).

REGRAS DE RESPOSTA:
- Seja proativo, autoritário e gentil.
- Use formatação Markdown simples (como **negrito**) para destacar nomes de medicamentos, doses, doenças ou termos importantes.
- Sempre forneça 2 a 3 sugestões de perguntas curtas e relevantes que o usuário possa fazer em seguida (no campo 'suggestions').
- Se o usuário perguntar sobre uma doença, tente primeiro encontrar no banco de dados local. Se não encontrar, use a busca para fornecer detalhes estruturados.
- Se o usuário perguntar sobre um procedimento de enfermagem, use EXCLUSIVAMENTE o Manual de Procedimentos Básicos de Enfermagem fornecido abaixo.
- Ao falar de medicamentos, cite sempre que as informações provêm do FNM de Moçambique.

TEXTO DO FORMULÁRIO NACIONAL DE MEDICAMENTOS (FNM):
${MEDICATION_FORM_TEXT}

MANUAL DE PROCEDIMENTOS BÁSICOS DE ENFERMAGEM:
${NURSING_MANUAL_TEXT}

CONTEXTO ATUAL DO APP:
${JSON.stringify(currentContext || {})}
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
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
          }
        },
      });
    } catch (searchError) {
      console.warn("AI Search Grounding failed, falling back to standard generation", searchError);
      // Fallback without googleSearch
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
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
          }
        },
      });
    }

    const result = extractJSON(response.text || "{}") || { text: "Não foi possível processar sua solicitação." };
    return {
      text: result.text || "Não foi possível processar sua solicitação.",
      command: result.command
    };
  } catch (error) {
    console.error("AI Service Error:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("GEMINI_API_KEY") || errorMessage.includes("VITE_GEMINI_API_KEY")) {
      return {
        text: "O Doutor IA precisa de uma chave de API configurada para funcionar. Por favor, adicione a GEMINI_API_KEY ou VITE_GEMINI_API_KEY nas configurações do projeto."
      };
    }
    return {
      text: "Desculpe, o cérebro do sistema está temporariamente indisponível. Por favor, tente novamente."
    };
  }
}

export async function searchDiseaseAI(diseaseName: string): Promise<Disease | null> {
  try {
    const ai = getAI();
    const systemInstruction = `
Você é um especialista médico moçambicano encarregado de fornecer informações precisas e estruturadas sobre a doença "${diseaseName}".

DIRETRIZES DE PESQUISA:
1. INFORMAÇÕES GERAIS (Nome, Descrição, Sintomas, Causas, Diagnóstico, Complicações, Cuidados de Enfermagem, Prevenção): Use a ferramenta de busca do Google para consultar fontes oficiais e confiáveis, priorizando a Organização Mundial da Saúde (OMS/WHO) e o Ministério da Saúde de Moçambique (MISAU).

2. MEDICAMENTOS E TRATAMENTOS (Medications):
   - FONTE PRIMÁRIA: Consulte o texto do Formulário Nacional de Medicamentos (FNM) de Moçambique fornecido abaixo.
   - FONTE SECUNDÁRIA: Se a doença ou o tratamento específico não forem encontrados no FNM, você DEVE usar a ferramenta de busca do Google para encontrar protocolos de tratamento baseados em evidências (OMS, diretrizes clínicas, artigos científicos).
   - DETALHAMENTO DA POSOLOGIA: Para cada medicamento, você deve obrigatoriamente incluir a posologia completa: DOSE, INTERVALO ENTRE AS TOMAS e DURAÇÃO DO TRATAMENTO.
   - IDENTIFICAÇÃO DA FONTE: No campo "name" ou "posology", indique se a informação provém do "FNM Moçambique" ou de "Diretrizes Internacionais/OMS".
   - Não deixe a lista de medicamentos vazia se existirem tratamentos conhecidos mundialmente, mesmo que não constem no trecho do FNM fornecido.

TEXTO DO FORMULÁRIO NACIONAL DE MEDICAMENTOS (FNM):
${MEDICATION_FORM_TEXT}

Você deve retornar os dados estruturados EXATAMENTE no formato JSON solicitado.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise e estruture os dados da doença: ${diseaseName}`,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
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
                description: "Lista de medicamentos encontrados no FNM que são indicados para esta doença. DEVE ser um array, mesmo que vazio.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nome do medicamento e apresentação (ex: DIGOXINA Comp. 0,25 mg)" },
                    posology: { type: Type.STRING, description: "Doses e via de administração conforme o FNM" },
                    contraindications: { type: Type.STRING, description: "Contraindicações conforme o FNM" }
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
          }
        }
      });
    } catch (searchError) {
      console.warn("Disease AI Search Grounding failed, falling back to standard generation", searchError);
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Estruture os dados da doença (com base no seu conhecimento): ${diseaseName}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
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
                description: "Lista de medicamentos conhecidos para esta doença.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    posology: { type: Type.STRING },
                    contraindications: { type: Type.STRING }
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
          }
        }
      });
    }

    const disease = extractJSON(response.text || "null");
    if (disease) {
      disease.id = disease.id || `ai-${Date.now()}`;
      disease.updatedAt = new Date().toISOString();
      disease.imageUrl = `https://loremflickr.com/1200/600/${encodeURIComponent(disease.name.toLowerCase())},disease,medical,health`;
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
1. FONTE PRIMÁRIA: Você deve usar o Manual de Procedimentos Básicos de Enfermagem fornecido abaixo para a estrutura base.
2. FONTE SECUNDÁRIA (INTERNET): Use a ferramenta de busca do Google para encontrar informações adicionais, clarificações, dicas práticas e evidências científicas recentes que complementem o manual.
3. ESTRUTURA: Forneça um conceito claro, lista de materiais, passos detalhados e observações críticas.

MANUAL DE PROCEDIMENTOS BÁSICOS DE ENFERMAGEM:
${NURSING_MANUAL_TEXT}

Você deve retornar os dados estruturados EXATAMENTE no formato JSON solicitado.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise na internet e no manual para fornecer os detalhes completos do procedimento: ${procedureName}`,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
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
          }
        }
      });
    } catch (searchError) {
      console.warn("Procedure AI Search Grounding failed, falling back to standard generation", searchError);
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Forneça os detalhes completos do procedimento (com base no seu conhecimento e manual): ${procedureName}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
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
          }
        }
      });
    }

    const procedure = extractJSON(response.text || "null");
    if (procedure) {
      procedure.id = procedure.id || `proc-${Date.now()}`;
      procedure.icon = procedure.icon || 'Activity';
      procedure.steps = procedure.procedureSteps.length;
      procedure.duration = procedure.duration || '15 min';
      procedure.guideCount = 1;
    }
    return procedure;
  } catch (error) {
    console.error("AI Procedure Search Error:", error);
    return null;
  }
}
