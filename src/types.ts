export type Screen = 'home' | 'diseases' | 'procedures' | 'profile' | 'disease-detail' | 'login' | 'signup' | 'ai-assistant';

export interface Medication {
  name: string;
  posology: string;
  contraindications: string;
}

export interface Disease {
  id: string;
  name: string;
  category: string;
  description: string;
  symptoms: string | string[] | Record<string, string[]>;
  causes: string | string[];
  diagnosis: string | string[];
  treatment: string | string[] | Record<string, string[]>;
  medications?: Medication[];
  complications: string | string[];
  nursingCare: string | string[];
  prevention: string | string[];
  updatedAt: string;
  type: 'Chronic' | 'Infectious' | 'Neurological';
  subtypes?: string[];
}

export interface Procedure {
  id: string;
  name: string;
  category: string;
  steps: number;
  duration: string;
  guideCount: number;
  icon: string;
}
