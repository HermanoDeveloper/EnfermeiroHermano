export type Screen = 'home' | 'diseases' | 'procedures' | 'profile' | 'disease-detail' | 'procedure-detail' | 'login' | 'signup' | 'ai-assistant';

export interface Medication {
  name: string;
  posology: string;
  contraindications: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  gender?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  category?: string;
  other_category?: string;
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
  localHistory?: string;
  imageUrl?: string;
}

export interface Procedure {
  id: string;
  name: string;
  category: string;
  steps: number;
  duration: string;
  guideCount: number;
  icon: string;
  concept?: string;
  materials?: string[];
  procedureSteps?: string[];
  observations?: string[];
}
