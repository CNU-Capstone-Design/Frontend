// Mock AI face parsing and modification
export async function parseFace(imageData: string): Promise<{ success: boolean; message?: string }> {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple face detection mock - check if image exists
  if (!imageData) {
    return { success: false, message: '이미지를 불러올 수 없습니다.' };
  }
  
  // Random success/failure for demo purposes (90% success rate)
  const isSuccess = Math.random() > 0.1;
  
  if (!isSuccess) {
    return { 
      success: false, 
      message: '얼굴을 인식할 수 없습니다. 정면 사진을 사용해주세요.' 
    };
  }
  
  return { success: true };
}

export async function applyModification(
  originalImage: string,
  partId: string,
  referenceImage: string,
  intensity: number
): Promise<string> {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would call an AI API
  // For now, return the original image
  return originalImage;
}

export function generateMockMask(
  canvas: HTMLCanvasElement,
  partId: string,
  width: number,
  height: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, width, height);
  
  // Generate simple geometric masks for demonstration
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.fillStyle = getMaskColor(partId);
  ctx.globalAlpha = 0.4;
  
  switch (partId) {
    case 'skin':
      // Full face oval
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, width * 0.35, height * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'eye_left':
      // Left eye
      ctx.beginPath();
      ctx.ellipse(centerX - width * 0.12, centerY - height * 0.08, width * 0.08, height * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'eye_right':
      // Right eye
      ctx.beginPath();
      ctx.ellipse(centerX + width * 0.12, centerY - height * 0.08, width * 0.08, height * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'eyebrow_left':
      // Left eyebrow
      ctx.beginPath();
      ctx.ellipse(centerX - width * 0.12, centerY - height * 0.15, width * 0.09, height * 0.02, -0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'eyebrow_right':
      // Right eyebrow
      ctx.beginPath();
      ctx.ellipse(centerX + width * 0.12, centerY - height * 0.15, width * 0.09, height * 0.02, 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'nose':
      // Nose
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - height * 0.05);
      ctx.lineTo(centerX - width * 0.05, centerY + height * 0.08);
      ctx.lineTo(centerX + width * 0.05, centerY + height * 0.08);
      ctx.closePath();
      ctx.fill();
      break;
    case 'mouth_upper':
      // Upper lip
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + height * 0.18, width * 0.1, height * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'mouth_lower':
      // Lower lip
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + height * 0.21, width * 0.1, height * 0.025, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'face_outline':
      // Face outline (stroke only)
      ctx.strokeStyle = getMaskColor(partId);
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, width * 0.35, height * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  
  ctx.globalAlpha = 1;
}

function getMaskColor(partId: string): string {
  const colors: Record<string, string> = {
    skin: 'rgba(255, 200, 200, 0.5)',
    eyebrow_left: 'rgba(139, 69, 19, 0.6)',
    eyebrow_right: 'rgba(160, 82, 45, 0.6)',
    eye_left: 'rgba(100, 149, 237, 0.6)',
    eye_right: 'rgba(65, 105, 225, 0.6)',
    nose: 'rgba(255, 228, 196, 0.6)',
    mouth_upper: 'rgba(255, 105, 180, 0.6)',
    mouth_lower: 'rgba(255, 20, 147, 0.6)',
    face_outline: 'rgba(255, 215, 0, 0.6)',
  };
  return colors[partId] || 'rgba(0, 0, 0, 0.3)';
}
