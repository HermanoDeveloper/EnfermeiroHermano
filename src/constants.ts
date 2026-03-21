import { Disease, Procedure } from './types';

export const DISEASES: Disease[] = [
  {
    id: '1',
    name: 'Hipertensão',
    category: 'Crônica',
    description: 'Condição médica de longo prazo na qual a pressão arterial está persistentemente elevada.',
    symptoms: {
      'Primária (Essencial)': [
        'Muitas vezes assintomática',
        'Dores de cabeça',
        'Falta de ar',
        'Sangramentos nasais'
      ],
      'Secundária': [
        'Sintomas da doença subjacente (ex: renal)',
        'Pressão arterial muito alta',
        'Início súbito ou difícil de controlar'
      ]
    },
    causes: [
      'Fatores genéticos',
      'Dieta rica em sal',
      'Sedentarismo',
      'Obesidade'
    ],
    diagnosis: 'Medição regular da pressão arterial (acima de 140/90 mmHg).',
    treatment: {
      'Primária (Essencial)': [
        'Mudanças no estilo de vida (dieta, exercícios)',
        'Medicamentos anti-hipertensivos'
      ],
      'Secundária': [
        'Tratamento da causa subjacente',
        'Medicamentos anti-hipertensivos específicos'
      ]
    },
    medications: [
      {
        name: 'Losartana Potássica',
        posology: '50mg a 100mg, uma vez ao dia.',
        contraindications: 'Hipersensibilidade, gravidez, insuficiência hepática grave.'
      },
      {
        name: 'Anlodipino',
        posology: '5mg a 10mg, uma vez ao dia.',
        contraindications: 'Hipotensão grave, choque cardiogênico, estenose aórtica.'
      }
    ],
    complications: [
      'AVC',
      'Infarto do miocárdio',
      'Insuficiência renal',
      'Problemas de visão'
    ],
    nursingCare: [
      'Monitoramento da PA',
      'Orientação sobre dieta',
      'Adesão ao tratamento medicamentoso'
    ],
    prevention: [
      'Redução do consumo de sal',
      'Exercícios regulares',
      'Controle de peso'
    ],
    updatedAt: '2h atrás',
    type: 'Chronic',
    subtypes: ['Primária (Essencial)', 'Secundária'],
  },
  {
    id: '2',
    name: 'Pneumonia',
    category: 'Infecciosa',
    description: 'Infecção que inflama os sacos de ar em um ou ambos os pulmões, que podem se encher de fluido.',
    symptoms: [
      'Tosse com catarro',
      'Febre',
      'Calafrios',
      'Dificuldade para respirar'
    ],
    causes: [
      'Bactérias',
      'Vírus',
      'Fungos'
    ],
    diagnosis: [
      'Exame físico',
      'Radiografia de tórax',
      'Exames de sangue'
    ],
    treatment: [
      'Antibióticos',
      'Antivirais',
      'Repouso',
      'Hidratação'
    ],
    medications: [
      {
        name: 'Amoxicilina + Clavulanato',
        posology: '500mg/125mg a 875mg/125mg, a cada 8 ou 12 horas.',
        contraindications: 'Hipersensibilidade a penicilinas, histórico de icterícia colestática.'
      },
      {
        name: 'Azitromicina',
        posology: '500mg, uma vez ao dia, por 3 a 5 dias.',
        contraindications: 'Hipersensibilidade a macrolídeos, insuficiência hepática grave.'
      }
    ],
    complications: [
      'Derrame pleural',
      'Abscesso pulmonar',
      'Insuficiência respiratória'
    ],
    nursingCare: [
      'Monitoramento da saturação de O2',
      'Auxílio na higiene brônquica',
      'Administração de medicamentos'
    ],
    prevention: [
      'Vacinação',
      'Lavagem das mãos',
      'Evitar tabagismo'
    ],
    updatedAt: '5h atrás',
    type: 'Infectious',
  },
  {
    id: '3',
    name: 'Diabetes Mellitus',
    category: 'Crônica',
    description: 'Grupo de distúrbios metabólicos caracterizados por um alto nível de açúcar no sangue por um período prolongado.',
    symptoms: {
      'Tipo 1': [
        'Sede excessiva (polidipsia)',
        'Micção frequente (poliúria)',
        'Fome constante (polifagia)',
        'Perda de peso inexplicada',
        'Fadiga extrema'
      ],
      'Tipo 2': [
        'Muitas vezes assintomática por anos',
        'Visão embaçada',
        'Feridas que demoram a cicatrizar',
        'Infecções frequentes'
      ],
      'Gestacional': [
        'Geralmente assintomática',
        'Detectada em exames de rotina durante a gravidez'
      ]
    },
    causes: [
      'Deficiência na produção ou ação da insulina'
    ],
    diagnosis: [
      'Glicemia de jejum',
      'Teste de tolerância à glicose',
      'Hemoglobina glicada'
    ],
    treatment: {
      'Tipo 1': [
        'Insulinoterapia vitalícia',
        'Contagem de carboidratos',
        'Monitoramento frequente da glicemia'
      ],
      'Tipo 2': [
        'Mudanças no estilo de vida',
        'Antidiabéticos orais',
        'Insulina (em alguns casos)'
      ],
      'Gestacional': [
        'Dieta controlada',
        'Atividade física monitorada',
        'Insulina se necessário'
      ]
    },
    medications: [
      {
        name: 'Metformina',
        posology: '500mg a 2550mg por dia, divididos em 2 ou 3 doses.',
        contraindications: 'Insuficiência renal grave, acidose metabólica, desidratação.'
      },
      {
        name: 'Insulina NPH',
        posology: 'Dose individualizada, geralmente administrada 1 ou 2 vezes ao dia.',
        contraindications: 'Hipoglicemia, hipersensibilidade aos componentes.'
      }
    ],
    complications: [
      'Retinopatia',
      'Neuropatia',
      'Nefropatia',
      'Doenças cardiovasculares'
    ],
    nursingCare: [
      'Monitoramento da glicemia capilar',
      'Inspeção dos pés',
      'Educação em diabetes'
    ],
    prevention: [
      'Alimentação saudável',
      'Atividade física regular',
      'Manutenção do peso ideal'
    ],
    updatedAt: 'Ontem',
    type: 'Chronic',
    subtypes: ['Tipo 1', 'Tipo 2', 'Gestacional'],
  },
  {
    id: '4',
    name: 'Doença de Alzheimer',
    category: 'Neurológica',
    description: 'Distúrbio neurológico progressivo que faz com que o cérebro encolha e as células cerebrais morram.',
    symptoms: [
      'Perda de memória',
      'Confusão mental',
      'Dificuldade em planejar ou resolver problemas'
    ],
    causes: [
      'Acúmulo de proteínas beta-amiloide e tau no cérebro'
    ],
    diagnosis: [
      'Avaliação cognitiva',
      'Exames de imagem (RM, TC)',
      'Exclusão de outras causas'
    ],
    treatment: [
      'Medicamentos para sintomas cognitivos',
      'Terapias ocupacionais'
    ],
    medications: [
      {
        name: 'Donepezila',
        posology: '5mg a 10mg, uma vez ao dia, à noite.',
        contraindications: 'Hipersensibilidade ao cloridrato de donepezila ou a derivados da piperidina.'
      },
      {
        name: 'Memantina',
        posology: '5mg a 20mg por dia, com aumento gradual da dose.',
        contraindications: 'Hipersensibilidade à memantina ou a qualquer componente da fórmula.'
      }
    ],
    complications: [
      'Inanição',
      'Pneumonia por aspiração',
      'Perda total da autonomia'
    ],
    nursingCare: [
      'Ambiente seguro',
      'Auxílio nas atividades diárias',
      'Suporte aos cuidadores'
    ],
    prevention: [
      'Estímulo cognitivo',
      'Controle de fatores de risco cardiovascular',
      'Dieta saudável'
    ],
    updatedAt: '2 dias atrás',
    type: 'Neurological',
  },
  {
    id: '5',
    name: 'Asma Brônquica',
    category: 'Crônica',
    description: 'Condição na qual suas vias aéreas se estreitam e incham e podem produzir muco extra.',
    symptoms: [
      'Falta de ar',
      'Aperto no peito',
      'Chiado ao respirar',
      'Tosse'
    ],
    causes: [
      'Fatores genéticos',
      'Fatores ambientais (alérgenos, poluição)'
    ],
    diagnosis: [
      'Espirometria',
      'Histórico clínico'
    ],
    treatment: [
      'Broncodilatadores',
      'Corticosteroides inalatórios'
    ],
    medications: [
      {
        name: 'Salbutamol (Aerossol)',
        posology: '100mcg a 200mcg (1 a 2 jatos) para alívio de sintomas.',
        contraindications: 'Hipersensibilidade ao salbutamol, ameaça de aborto.'
      },
      {
        name: 'Budesonida (Inalatória)',
        posology: '200mcg a 800mcg por dia, divididos em 2 doses.',
        contraindications: 'Hipersensibilidade à budesonida, tuberculose pulmonar ativa.'
      }
    ],
    complications: [
      'Crises graves',
      'Limitação das atividades diárias',
      'Remodelamento das vias aéreas'
    ],
    nursingCare: [
      'Orientação sobre uso de inaladores',
      'Identificação de gatilhos',
      'Monitoramento respiratório'
    ],
    prevention: [
      'Evitar gatilhos (poeira, mofo)',
      'Vacinação contra gripe',
      'Acompanhamento médico regular'
    ],
    updatedAt: '3 dias atrás',
    type: 'Chronic',
  },
];

export const PROCEDURES: Procedure[] = [
  {
    id: '1',
    name: 'Controle de Infecção',
    category: 'Enfermagem',
    steps: 8,
    duration: '10 min',
    guideCount: 12,
    icon: 'ShieldCheck',
  },
  {
    id: '2',
    name: 'Admin. de Medicamentos',
    category: 'Clínico',
    steps: 12,
    duration: '15 min',
    guideCount: 24,
    icon: 'Syringe',
  },
  {
    id: '3',
    name: 'Sinais Vitais',
    category: 'Enfermagem',
    steps: 6,
    duration: '5 min',
    guideCount: 8,
    icon: 'Activity',
  },
  {
    id: '4',
    name: 'Cuidados de Emergência',
    category: 'Agudo',
    steps: 15,
    duration: '20 min',
    guideCount: 15,
    icon: 'Stethoscope',
  },
];
