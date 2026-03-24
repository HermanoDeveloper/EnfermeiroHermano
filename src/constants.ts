import { Disease, Procedure } from './types';

export const DISEASES: Disease[] = [
  {
    id: '6',
    name: 'Anemia Falciforme',
    category: 'Crônica',
    description: 'Doença hereditária caracterizada pela produção de glóbulos vermelhos com formato de foice, dificultando a circulação.',
    symptoms: ['Dores intensas (crises)', 'Fadiga', 'Palidez', 'Icterícia'],
    causes: ['Mutação genética hereditária'],
    diagnosis: ['Eletroforese de hemoglobina', 'Teste do pezinho'],
    treatment: ['Hidratação', 'Analgésicos', 'Transfusões de sangue', 'Hidroxiureia'],
    complications: ['AVC', 'Infecções frequentes', 'Síndrome torácica aguda'],
    nursingCare: ['Manejo da dor', 'Monitoramento de sinais de infecção', 'Educação familiar'],
    prevention: ['Aconselhamento genético'],
    updatedAt: 'Recente',
    type: 'Chronic',
    localHistory: 'Moçambique tem uma das maiores prevalências de anemia falciforme na África Austral, com programas de rastreio neonatal em expansão.',
    imageUrl: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?q=80&w=1200&auto=format&fit=crop',
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
    localHistory: 'A asma é comum em áreas urbanas de Moçambique, onde a poluição do ar e as condições alérgicas contribuem para a frequência das crises.',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '7',
    name: 'Cólera',
    category: 'Infecciosa',
    description: 'Doença bacteriana aguda causada pela ingestão de água ou alimentos contaminados com Vibrio cholerae.',
    symptoms: ['Diarreia aquosa profusa', 'Vômitos', 'Desidratação rápida', 'Cãibras'],
    causes: ['Bactéria Vibrio cholerae'],
    diagnosis: ['Cultura de fezes', 'Testes rápidos de diagnóstico'],
    treatment: ['Reidratação oral e endovenosa', 'Antibióticos em casos graves'],
    complications: ['Choque hipovolêmico', 'Insuficiência renal', 'Morte em poucas horas'],
    nursingCare: ['Isolamento entérico', 'Monitoramento rigoroso de balanço hídrico', 'Desinfecção'],
    prevention: ['Saneamento básico', 'Água potável', 'Vacinação oral', 'Higiene das mãos'],
    updatedAt: 'Atualizado',
    type: 'Infectious',
    localHistory: 'Surtos cíclicos de cólera ocorrem em Moçambique, especialmente durante a época das chuvas e após ciclones, exigindo respostas rápidas de saúde pública.',
    imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=1200&auto=format&fit=crop',
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
    localHistory: 'O diagnóstico de diabetes tem aumentado em Moçambique, desafiando o sistema de saúde a fornecer tratamento contínuo e educação para o autocuidado.',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop',
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
    localHistory: 'Embora subdiagnosticada, a demência e o Alzheimer começam a ser reconhecidos como problemas de saúde pública em Moçambique com o aumento da esperança de vida.',
    imageUrl: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '14',
    name: 'Epilepsia',
    category: 'Neurológica',
    description: 'Distúrbio no qual a atividade das células nervosas no cérebro é perturbada, causando convulsões.',
    symptoms: ['Convulsões recorrentes', 'Perda de consciência', 'Espasmos musculares'],
    causes: ['Lesões cerebrais', 'Genética', 'Infecções (ex: neurocisticercose)'],
    diagnosis: ['EEG', 'RM/TC cerebral', 'Histórico de crises'],
    treatment: ['Medicamentos antiepilépticos'],
    complications: ['Status epilepticus', 'Lesões por quedas'],
    nursingCare: ['Proteção durante crises', 'Educação sobre adesão ao tratamento', 'Combate ao estigma'],
    prevention: ['Prevenção de lesões cerebrais', 'Tratamento de infecções'],
    updatedAt: 'Semana passada',
    type: 'Neurological',
    localHistory: 'Em Moçambique, a epilepsia ainda enfrenta estigma social, exigindo esforços de educação comunitária e acesso a medicamentos básicos.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '13',
    name: 'Gastrite',
    category: 'Crônica',
    description: 'Inflamação, irritação ou erosão do revestimento do estômago.',
    symptoms: ['Dor epigástrica', 'Náuseas', 'Azia', 'Sensação de enfartamento'],
    causes: ['H. pylori', 'Uso de AINEs', 'Álcool', 'Stress'],
    diagnosis: ['Endoscopia digestiva alta', 'Teste de H. pylori'],
    treatment: ['Antiácidos', 'Inibidores da bomba de protões', 'Antibióticos para H. pylori'],
    complications: ['Úlceras gástricas', 'Cancro do estômago'],
    nursingCare: ['Orientação dietética', 'Administração de medicamentos', 'Educação sobre hábitos'],
    prevention: ['Alimentação equilibrada', 'Evitar automedicação'],
    updatedAt: '3 dias atrás',
    type: 'Chronic',
    localHistory: 'A gastrite é uma queixa comum em Moçambique, muitas vezes associada a hábitos alimentares e stress.',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop',
  },
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
      'Exercícios regulares'
    ],
    updatedAt: '2h atrás',
    type: 'Chronic',
    subtypes: ['Primária (Essencial)', 'Secundária'],
    localHistory: 'Em Moçambique, a hipertensão é uma das principais causas de doenças cardiovasculares, afetando uma parcela crescente da população adulta urbana e rural devido a mudanças na dieta e estilo de vida.',
    imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '8',
    name: 'HIV/SIDA',
    category: 'Infecciosa',
    description: 'Vírus que ataca o sistema imunológico, podendo levar à Síndrome da Imunodeficiência Adquirida.',
    symptoms: ['Febre', 'Perda de peso', 'Infecções oportunistas', 'Linfadenopatia'],
    causes: ['Vírus da Imunodeficiência Humana (HIV)'],
    diagnosis: ['Testes rápidos de anticorpos', 'Carga viral', 'Contagem de CD4'],
    treatment: ['Terapia Antirretroviral (TARV)'],
    complications: ['Tuberculose', 'Sarcoma de Kaposi', 'Meningite criptocócica'],
    nursingCare: ['Apoio à adesão à TARV', 'Prevenção de infecções', 'Aconselhamento psicossocial'],
    prevention: ['Uso de preservativos', 'PrEP/PEP', 'Circuncisão masculina médica', 'Prevenção da transmissão vertical'],
    updatedAt: 'Hoje',
    type: 'Infectious',
    localHistory: 'Moçambique enfrenta uma das maiores epidemias de HIV do mundo, mas tem feito progressos significativos na expansão do acesso ao tratamento gratuito.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '15',
    name: 'Insuficiência Renal',
    category: 'Crônica',
    description: 'Condição em que os rins perdem a capacidade de filtrar resíduos do sangue.',
    symptoms: ['Edema', 'Diminuição da diurese', 'Fadiga', 'Náuseas'],
    causes: ['Diabetes', 'Hipertensão', 'Glomerulonefrite'],
    diagnosis: ['Creatinina sérica', 'Taxa de filtração glomerular', 'Ecografia renal'],
    treatment: ['Controle de causas base', 'Diálise', 'Transplante'],
    complications: ['Anemia', 'Doença óssea', 'Sobrecarga hídrica'],
    nursingCare: ['Controle de peso diário', 'Restrição hídrica e dietética', 'Cuidado com acesso vascular'],
    prevention: ['Controle da PA e Glicemia', 'Evitar nefrotóxicos'],
    updatedAt: 'Recente',
    type: 'Chronic',
    localHistory: 'O acesso à hemodiálise em Moçambique tem crescido, mas a prevenção da hipertensão e diabetes continua sendo a estratégia principal.',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '9',
    name: 'Malária',
    category: 'Infecciosa',
    description: 'Doença infecciosa febril aguda transmitida pela picada do mosquito Anopheles infectado.',
    symptoms: ['Febre alta', 'Calafrios', 'Cefaleia', 'Mialgia', 'Anemia'],
    causes: ['Parasitas do gênero Plasmodium'],
    diagnosis: ['Gota espessa', 'Testes de diagnóstico rápido (TDR)'],
    treatment: ['Artemisinina e derivados (ACTs)'],
    complications: ['Malária cerebral', 'Anemia grave', 'Insuficiência renal'],
    nursingCare: ['Controle da febre', 'Monitoramento de sinais de perigo', 'Administração de antimaláricos'],
    prevention: ['Redes mosquiteiras tratadas', 'Pulverização intradomiciliária', 'Tratamento preventivo na gravidez'],
    updatedAt: '1h atrás',
    type: 'Infectious',
    localHistory: 'A malária é a principal causa de consultas médicas e internamentos em Moçambique, sendo endêmica em todo o país.',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '12',
    name: 'Meningite',
    category: 'Infecciosa',
    description: 'Inflamação das membranas que revestem o cérebro e a medula espinhal.',
    symptoms: ['Rigidez na nuca', 'Febre alta', 'Fotofobia', 'Confusão'],
    causes: ['Bactérias, vírus, fungos'],
    diagnosis: ['Punção lombar (LCR)', 'Hemoculturas'],
    treatment: ['Antibióticos ou antivirais urgentes'],
    complications: ['Perda auditiva', 'Danos cerebrais', 'Sepse'],
    nursingCare: ['Monitoramento neurológico', 'Ambiente calmo e escuro', 'Controle de sinais vitais'],
    prevention: ['Vacinação', 'Profilaxia para contatos'],
    updatedAt: 'Recente',
    type: 'Infectious',
    localHistory: 'Surtos de meningite bacteriana são monitorados de perto, especialmente em áreas de alta densidade populacional.',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1200&auto=format&fit=crop',
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
    localHistory: 'A pneumonia continua sendo uma das principais causas de mortalidade infantil em Moçambique, frequentemente associada a condições de habitação e nutrição.',
    imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '11',
    name: 'Sarampo',
    category: 'Infecciosa',
    description: 'Doença viral altamente contagiosa que causa exantema e febre.',
    symptoms: ['Febre', 'Tosse', 'Coriza', 'Manchas de Koplik', 'Exantema maculopapular'],
    causes: ['Vírus do sarampo'],
    diagnosis: ['Clínico', 'Sorologia'],
    treatment: ['Suporte', 'Vitamina A'],
    complications: ['Pneumonia', 'Encefalite', 'Cegueira'],
    nursingCare: ['Isolamento respiratório', 'Hidratação', 'Cuidado com os olhos'],
    prevention: ['Vacinação (duas doses)'],
    updatedAt: 'Ontem',
    type: 'Infectious',
    localHistory: 'Campanhas de vacinação em massa são frequentes em Moçambique para prevenir surtos de sarampo em crianças.',
    imageUrl: 'https://images.unsplash.com/photo-1605092676920-8ac5ae40c7c8?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '10',
    name: 'Tuberculose',
    category: 'Infecciosa',
    description: 'Doença infecciosa que afeta principalmente os pulmões, causada pelo Mycobacterium tuberculosis.',
    symptoms: ['Tosse persistentente (+3 semanas)', 'Febre vespertina', 'Suores noturnos', 'Emagrecimento'],
    causes: ['Mycobacterium tuberculosis'],
    diagnosis: ['Bacilosocopia (escarro)', 'GeneXpert', 'Radiografia de tórax'],
    treatment: ['Esquema de antibióticos por 6 meses ou mais'],
    complications: ['TB Multirresistente', 'Derrame pleural', 'Disseminação extrapulmonar'],
    nursingCare: ['Controle de infeção', 'Acompanhamento do tratamento (DOTS)', 'Educação sobre etiqueta da tosse'],
    prevention: ['Vacina BCG', 'Tratamento preventivo', 'Ventilação de ambientes'],
    updatedAt: '4h atrás',
    type: 'Infectious',
    localHistory: 'Moçambique é um dos países com maior carga de TB e coinfecção TB/HIV, com esforços focados na detecção precoce e conclusão do tratamento.',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1200&auto=format&fit=crop',
  },
];

export const PROCEDURES: Procedure[] = [
  {
    id: '1',
    name: 'Higiene Oral',
    category: 'Higiene',
    steps: 8,
    duration: '10 min',
    guideCount: 5,
    icon: 'Activity',
  },
  {
    id: '2',
    name: 'Banho no Leito',
    category: 'Higiene',
    steps: 12,
    duration: '30 min',
    guideCount: 8,
    icon: 'Activity',
  },
  {
    id: '3',
    name: 'Higiene da Genitália',
    category: 'Higiene',
    steps: 6,
    duration: '15 min',
    guideCount: 4,
    icon: 'Activity',
  },
  {
    id: '4',
    name: 'Preparo do Leito',
    category: 'Conforto',
    steps: 10,
    duration: '15 min',
    guideCount: 6,
    icon: 'Activity',
  },
  {
    id: '5',
    name: 'Aplicação de Calor e Frio',
    category: 'Terapêutico',
    steps: 5,
    duration: '20 min',
    guideCount: 3,
    icon: 'Thermometer',
  },
  {
    id: '6',
    name: 'Posições Terapêuticas',
    category: 'Conforto',
    steps: 8,
    duration: '5 min',
    guideCount: 12,
    icon: 'Activity',
  },
  {
    id: '7',
    name: 'Movimentação e Transporte',
    category: 'Segurança',
    steps: 10,
    duration: '10 min',
    guideCount: 8,
    icon: 'Activity',
  },
  {
    id: '8',
    name: 'Coleta de Material',
    category: 'Diagnóstico',
    steps: 12,
    duration: '15 min',
    guideCount: 15,
    icon: 'Microscope',
  },
  {
    id: '9',
    name: 'Alimentação do Paciente',
    category: 'Nutrição',
    steps: 10,
    duration: '20 min',
    guideCount: 7,
    icon: 'Activity',
  },
  {
    id: '10',
    name: 'Curativos',
    category: 'Clínico',
    steps: 10,
    duration: '15 min',
    guideCount: 12,
    icon: 'ShieldCheck',
  },
  {
    id: '11',
    name: 'Sondagem Gástrica',
    category: 'Procedimento',
    steps: 14,
    duration: '20 min',
    guideCount: 10,
    icon: 'Stethoscope',
  },
  {
    id: '12',
    name: 'Cateterismo Vesical',
    category: 'Procedimento',
    steps: 18,
    duration: '25 min',
    guideCount: 15,
    icon: 'Stethoscope',
  },
  {
    id: '13',
    name: 'Punção Venosa',
    category: 'Procedimento',
    steps: 15,
    duration: '10 min',
    guideCount: 20,
    icon: 'Syringe',
  },
  {
    id: '14',
    name: 'Admin. de Medicamentos',
    category: 'Clínico',
    steps: 12,
    duration: '15 min',
    guideCount: 24,
    icon: 'Syringe',
  },
];
