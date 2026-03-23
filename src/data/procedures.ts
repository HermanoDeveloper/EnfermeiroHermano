import { Procedure } from '../types';

export interface DetailedProcedure extends Procedure {
  concept: string;
  materials: string[];
  procedureSteps: string[];
  observations?: string[];
}

export const DETAILED_PROCEDURES: DetailedProcedure[] = [
  {
    id: '1',
    name: 'Higiene Oral',
    category: 'Higiene',
    steps: 8,
    duration: '10 min',
    guideCount: 5,
    icon: 'Activity',
    concept: 'Higienização da cavidade oral (boca, palato, dentes, gengiva e língua).',
    materials: ['Escova de dentes', 'Espátula', 'Pasta de dente ou antisséptico', 'Toalha', 'Sistema de aspiração', 'Hidratante labial', 'Cuba rim'],
    procedureSteps: [
      'Higienizar as mãos.',
      'Posição de Fowler ou decúbito lateral.',
      'Oferecer escova com pasta.',
      'Enxaguar com copo de água e cuba rim.',
      'Secar e hidratar lábios.',
      'Usar abaixador de língua para abrir a boca (se inconsciente).',
      'Limpar dentes, gengivas, bochechas e palato com Swab.',
      'Aspirar cavidade bucal.'
    ],
    observations: ['Manter a cabeceira elevada para evitar aspiração.', 'Observar sangramentos ou lesões na mucosa.']
  },
  {
    id: '2',
    name: 'Banho no Leito',
    category: 'Higiene',
    steps: 12,
    duration: '30 min',
    guideCount: 8,
    icon: 'Activity',
    concept: 'Higiene corporal total do paciente restrito ao leito.',
    materials: ['Luvas', 'Sabonete', 'Hidratante', 'Toalhas', 'Bacias', 'Jarro', 'Comadre', 'Roupas limpas'],
    procedureSteps: [
      'Higienizar mãos e calçar luvas.',
      'Lavar rosto (ensaboar, enxaguar, secar).',
      'Lavar membros superiores (distal para proximal).',
      'Lavar tórax e axilas.',
      'Lavar membros inferiores.',
      'Virar em decúbito lateral para lavar costas e nádegas.',
      'Realizar higiene íntima.',
      'Vestir o paciente e arrumar o leito.'
    ],
    observations: ['Manter a privacidade do paciente.', 'Avaliar integridade da pele durante o processo.']
  },
  {
    id: '3',
    name: 'Higiene da Genitália',
    category: 'Higiene',
    steps: 6,
    duration: '15 min',
    guideCount: 4,
    icon: 'Activity',
    concept: 'Limpeza da região íntima para prevenir infecções.',
    materials: ['Luvas', 'Sabonete pH neutro', 'Toalha', 'Bacias', 'Impermeável', 'Jarro com água morna', 'Comadre'],
    procedureSteps: [
      'Higienizar mãos e calçar luvas.',
      'Colocar comadre sob o paciente.',
      'Mulheres: Lavar da região pubiana para a anal (unidirecional).',
      'Homens: Retrair o prepúcio para limpar a glande.',
      'Enxaguar abundantemente.',
      'Secar cuidadosamente.'
    ]
  },
  {
    id: '4',
    name: 'Preparo do Leito',
    category: 'Conforto',
    steps: 10,
    duration: '15 min',
    guideCount: 6,
    icon: 'Activity',
    concept: 'Arrumação da cama hospitalar para garantir conforto e higiene.',
    materials: ['Lençóis limpos', 'Fronha', 'Impermeável', 'Traçado', 'Hamper para roupa suja'],
    procedureSteps: [
      'Higienizar mãos.',
      'Retirar roupa suja sem sacudir (colocar no hamper).',
      'Estender lençol de baixo e fazer os cantos.',
      'Colocar impermeável e traçado no centro.',
      'Colocar lençol de cima com prega de conforto.',
      'Colocar a fronha no travesseiro.'
    ]
  },
  {
    id: '5',
    name: 'Aplicação de Calor e Frio',
    category: 'Terapêutico',
    steps: 5,
    duration: '20 min',
    guideCount: 3,
    icon: 'Thermometer',
    concept: 'Uso de temperaturas extremas para fins terapêuticos (analgesia, edema).',
    materials: ['Bolsas térmicas', 'Compressas', 'Toalhas de proteção'],
    procedureSteps: [
      'Avaliar a área da aplicação.',
      'Proteger a pele com toalha ou tecido.',
      'Aplicar a bolsa térmica (quente ou fria).',
      'Monitorar a pele a cada 5-10 minutos.',
      'Retirar após 20-30 minutos.'
    ],
    observations: ['Calor contraindicado em hemorragias agudas.', 'Frio contraindicado em áreas com má circulação.']
  },
  {
    id: '10',
    name: 'Curativos',
    category: 'Clínico',
    steps: 10,
    duration: '15 min',
    guideCount: 12,
    icon: 'ShieldCheck',
    concept: 'Limpeza e proteção de feridas operatórias ou abertas.',
    materials: ['Kit curativo estéril', 'SF 0,9%', 'Gaze', 'Fita adesiva', 'Luvas de procedimento/estéreis'],
    procedureSteps: [
      'Higienizar mãos.',
      'Remover curativo anterior com luvas de procedimento.',
      'Limpar a ferida com jatos de SF 0,9%.',
      'Secar as bordas da ferida.',
      'Aplicar cobertura indicada (AGE, Alginato, etc).',
      'Ocluir com gaze e fixar.'
    ]
  },
  {
    id: '11',
    name: 'Sondagem Gástrica',
    category: 'Procedimento',
    steps: 14,
    duration: '20 min',
    guideCount: 10,
    icon: 'Stethoscope',
    concept: 'Inserção de sonda no estômago para alimentação ou drenagem.',
    materials: ['Sonda gástrica', 'Xilocaína gel', 'Seringa 20mL', 'Estetoscópio', 'Fita adesiva', 'Copo com água'],
    procedureSteps: [
      'Medir a sonda (nariz ao lóbulo da orelha até apêndice xifoide).',
      'Lubrificar a ponta da sonda.',
      'Introduzir pela narina solicitando que o paciente degluta.',
      'Verificar posicionamento (ausculta, aspiração de pH).',
      'Fixar a sonda no nariz.'
    ]
  },
  {
    id: '13',
    name: 'Punção Venosa',
    category: 'Procedimento',
    steps: 15,
    duration: '10 min',
    guideCount: 20,
    icon: 'Syringe',
    concept: 'Acesso ao sistema venoso para administração de fluidos ou coleta.',
    materials: ['Scalp ou Jelco', 'Garrote', 'Álcool 70%', 'Algodão', 'Fixação (Tegaderm/Micropore)', 'Luvas'],
    procedureSteps: [
      'Garrotear 10-15cm acima do local escolhido.',
      'Realizar antissepsia unidirecional.',
      'Puncionar a veia em ângulo de 10-30°.',
      'Observar refluxo sanguíneo.',
      'Retirar garrote, fixar e identificar.'
    ]
  }
];
