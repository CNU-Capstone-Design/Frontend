export interface Simulation {
  id: string;
  name: string;
  createdAt: Date;
  originalImage: string;
  resultImage: string;
  faceParts: FacePart[];
  modifications: Modification[];
}

export interface FacePart {
  id: string;
  name: string;
  color: string;
  selected: boolean;
  maskData?: string;
}

export interface Modification {
  partId: string;
  referenceImage?: string;
  intensity: number;
}

// id 가 모델 region 이름과 1:1 대응 (skin/brow/eye/nose/mouth/hair/ear/neck)
export const FACE_PARTS: Omit<FacePart, 'selected'>[] = [
  { id: 'skin',  name: '피부',      color: '#f4a261' },
  { id: 'brow',  name: '눈썹',      color: '#8b4513' },
  { id: 'eye',   name: '눈',        color: '#4169e1' },
  { id: 'nose',  name: '코',        color: '#e9c46a' },
  { id: 'mouth', name: '입',        color: '#e63946' },
  { id: 'hair',  name: '머리카락',  color: '#6d4c41' },
  { id: 'ear',   name: '귀',        color: '#f48fb1' },
  { id: 'neck',  name: '목',        color: '#a8dadc' },
];
