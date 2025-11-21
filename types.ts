export enum CriteriaKey {
  COMMUNICATION = 'communication',
  EFFICIENCY = 'efficiency',
  SELF_LEARNING = 'selfLearning',
  ATTITUDE = 'attitude',
  QUALITY = 'quality'
}

export const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  [CriteriaKey.COMMUNICATION]: '沟通能力',
  [CriteriaKey.EFFICIENCY]: '工作效率',
  [CriteriaKey.SELF_LEARNING]: '自学能力',
  [CriteriaKey.ATTITUDE]: '工作态度',
  [CriteriaKey.QUALITY]: '交付质量',
};

export interface Evaluation {
  id: string;
  raterName: string;
  scores: Record<CriteriaKey, number>; // 0-10
  comment: string;
  date: string;
}

export type Gender = 'male' | 'female';

export interface Intern {
  id: string;
  name: string;
  gender: Gender;
  joinDate: string; 
  avatarId: string; 
  role: string;
  evaluations: Evaluation[];
  aiSummary?: string;
}

export interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}