export type Screen = 'home' | 'diseases' | 'procedures' | 'profile' | 'disease-detail' | 'login' | 'signup';

export interface Disease {
  id: string;
  name: string;
  category: string;
  description: string;
  updatedAt: string;
  type: 'Chronic' | 'Infectious' | 'Neurological';
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
