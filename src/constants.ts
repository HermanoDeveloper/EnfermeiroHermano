import { Disease, Procedure } from './types';

export const DISEASES: Disease[] = [
  {
    id: '1',
    name: 'Hipertensão',
    category: 'Crônica',
    description: 'Condição médica de longo prazo na qual a pressão arterial está persistentemente elevada.',
    updatedAt: '2h atrás',
    type: 'Chronic',
  },
  {
    id: '2',
    name: 'Pneumonia',
    category: 'Infecciosa',
    description: 'Infecção que inflama os sacos de ar em um ou ambos os pulmões, que podem se encher de fluido.',
    updatedAt: '5h atrás',
    type: 'Infectious',
  },
  {
    id: '3',
    name: 'Diabetes Mellitus',
    category: 'Crônica',
    description: 'Grupo de distúrbios metabólicos caracterizados por um alto nível de açúcar no sangue por um período prolongado.',
    updatedAt: 'Ontem',
    type: 'Chronic',
  },
  {
    id: '4',
    name: 'Doença de Alzheimer',
    category: 'Neurológica',
    description: 'Distúrbio neurológico progressivo que faz com que o cérebro encolha e as células cerebrais morram.',
    updatedAt: '2 dias atrás',
    type: 'Neurological',
  },
  {
    id: '5',
    name: 'Asma Brônquica',
    category: 'Crônica',
    description: 'Condição na qual suas vias aéreas se estreitam e incham e podem produzir muco extra.',
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
