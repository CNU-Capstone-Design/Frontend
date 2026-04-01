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

export const FACE_PARTS: Omit<FacePart, 'selected'>[] = [
  { id: 'skin', name: '피부', color: 'rgba(255, 200, 200, 0.3)' },
  { id: 'eyebrow_left', name: '왼쪽 눈썹', color: 'rgba(139, 69, 19, 0.4)' },
  { id: 'eyebrow_right', name: '오른쪽 눈썹', color: 'rgba(160, 82, 45, 0.4)' },
  { id: 'eye_left', name: '왼쪽 눈', color: 'rgba(100, 149, 237, 0.4)' },
  { id: 'eye_right', name: '오른쪽 눈', color: 'rgba(65, 105, 225, 0.4)' },
  { id: 'nose', name: '코', color: 'rgba(255, 228, 196, 0.4)' },
  { id: 'mouth_upper', name: '윗입술', color: 'rgba(255, 105, 180, 0.4)' },
  { id: 'mouth_lower', name: '아랫입술', color: 'rgba(255, 20, 147, 0.4)' },
  { id: 'face_outline', name: '얼굴 윤곽', color: 'rgba(255, 215, 0, 0.3)' },
];
