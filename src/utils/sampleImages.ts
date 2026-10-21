/**
 * Generates instant realistic sample photobooth photos on canvas
 * Used as fallback or simulation mode when webcam is unavailable.
 */

const SAMPLE_PALETTES = [
  { bg: '#3B82F6', skin: '#FCD34D', shirt: '#1E293B', hair: '#451A03', pose: 'smile' },
  { bg: '#EC4899', skin: '#FDE047', shirt: '#F43F5E', hair: '#18181B', pose: 'peace' },
  { bg: '#8B5CF6', skin: '#FBBF24', shirt: '#047857', hair: '#7C2D12', pose: 'laugh' },
  { bg: '#10B981', skin: '#FEF08A', shirt: '#D97706', hair: '#0284C7', pose: 'wink' },
];

export function createSamplePhoto(poseIndex: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const theme = SAMPLE_PALETTES[poseIndex % SAMPLE_PALETTES.length];

  // Studio background with gentle vignette
  const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 360);
  grad.addColorStop(0, theme.bg);
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 480);

  // Soft studio bokeh particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (let i = 0; i < 16; i++) {
    const bx = (i * 47 + poseIndex * 89) % 640;
    const by = (i * 73 + poseIndex * 43) % 480;
    const br = 12 + (i % 5) * 8;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Silhouette / Stylized Portrait
  // Shoulders & Body
  ctx.fillStyle = theme.shirt;
  ctx.beginPath();
  ctx.ellipse(320, 440, 190, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#EAB308';
  ctx.fillRect(290, 290, 60, 60);

  // Head
  ctx.fillStyle = theme.skin;
  ctx.beginPath();
  ctx.ellipse(320, 230, 95, 115, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = theme.hair;
  ctx.beginPath();
  ctx.arc(320, 175, 105, Math.PI * 0.85, Math.PI * 2.15);
  ctx.fill();

  // Hair bangs
  ctx.beginPath();
  ctx.ellipse(320, 170, 90, 45, 0, 0, Math.PI);
  ctx.fill();

  // Cheerful Eyes
  ctx.fillStyle = '#18181B';
  if (theme.pose === 'wink') {
    // Wink eye
    ctx.beginPath();
    ctx.arc(280, 225, 12, 0, Math.PI * 2);
    ctx.fill();
    // Closed winking line
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(360, 230, 14, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(280, 225, 12, 0, Math.PI * 2);
    ctx.arc(360, 225, 12, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight in eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(284, 221, 4, 0, Math.PI * 2);
    ctx.arc(364, 221, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.beginPath();
  ctx.arc(260, 255, 18, 0, Math.PI * 2);
  ctx.arc(380, 255, 18, 0, Math.PI * 2);
  ctx.fill();

  // Big photobooth smile
  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(320, 260, 36, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Peace sign gesture if pose is peace
  if (theme.pose === 'peace') {
    ctx.fillStyle = theme.skin;
    ctx.beginPath();
    ctx.ellipse(450, 340, 25, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    // Fingers
    ctx.lineWidth = 14;
    ctx.strokeStyle = theme.skin;
    ctx.beginPath();
    ctx.moveTo(445, 335);
    ctx.lineTo(440, 270);
    ctx.moveTo(455, 335);
    ctx.lineTo(470, 275);
    ctx.stroke();
  }

  // Photobooth subtle timestamp in corner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 16px monospace';
  ctx.fillText(`POSE 0${poseIndex + 1} • SIMULATOR`, 24, 456);

  return canvas.toDataURL('image/jpeg', 0.92);
}
