/**
 * Photobooth Strip Canvas Renderer
 * Generates print-ready high-resolution photostrips, grids, and postcards.
 * Fully supports WYSIWYG LumaBooth LayoutTemplate layers!
 */

import { FilterType, FrameTheme, LayoutFormat, PhotoboothSettings, SessionPhoto, StickerItem, LayoutTemplate } from '../types';
import QRCode from 'qrcode';

export const THEME_COLORS: Record<FrameTheme, { bg: string; text: string; subtext: string; border?: string }> = {
  'classic-white': { bg: '#FFFFFF', text: '#18181B', subtext: '#71717A' },
  'matte-black': { bg: '#18181B', text: '#FFFFFF', subtext: '#A1A1AA' },
  'vintage-cream': { bg: '#FAF5EE', text: '#451A03', subtext: '#78350F' },
  'blush-pink': { bg: '#FDF2F8', text: '#831843', subtext: '#BE185D' },
  'midnight-navy': { bg: '#0F172A', text: '#F8FAFC', subtext: '#94A3B8' },
  'cyber-purple': { bg: '#1E1B4B', text: '#E0E7FF', subtext: '#A5B4FC' },
  'golden-hour': { bg: '#FEF3C7', text: '#78350F', subtext: '#B45309' },
  'checkerboard': { bg: '#F4F4F5', text: '#09090B', subtext: '#52525B', border: '#18181B' },
};

/**
 * Applies visual filter string for HTML canvas ctx.filter
 */
export function getCanvasFilterString(filter: FilterType): string {
  switch (filter) {
    case 'warm-vintage':
      return 'sepia(35%) contrast(110%) brightness(105%) saturate(125%)';
    case 'bw-contrast':
      return 'grayscale(100%) contrast(150%) brightness(100%)';
    case 'tokyo-pastel':
      return 'contrast(95%) brightness(115%) saturate(110%) hue-rotate(-10deg)';
    case 'cyber-neon':
      return 'contrast(135%) saturate(160%) hue-rotate(20deg)';
    case 'sepia':
      return 'sepia(85%) contrast(105%) brightness(95%)';
    case 'soft-glow':
      return 'brightness(110%) contrast(102%) saturate(105%)';
    case 'film-grain':
      return 'contrast(115%) brightness(95%) saturate(90%) sepia(15%)';
    case 'normal':
    default:
      return 'none';
  }
}

/**
 * Loads image from data URL into an HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Draws an image maintaining aspect ratio and centering (cover crop)
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sWidth = img.width;
  let sHeight = img.height;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

/**
 * Generates the complete high-resolution strip canvas.
 * Can render either from a custom LumaBooth LayoutTemplate or default layout.
 */
export async function renderPhotoboothStrip(
  photos: SessionPhoto[],
  format: LayoutFormat,
  filter: FilterType,
  theme: FrameTheme,
  settings: PhotoboothSettings,
  stickers: StickerItem[] = [],
  customTemplate?: LayoutTemplate
): Promise<string> {
  const loadedPhotos = await Promise.all(photos.map(p => loadImage(p.dataUrl)));
  if (loadedPhotos.length === 0) return '';

  const canvas = document.createElement('canvas');
  const filterString = getCanvasFilterString(filter);

  // -------------------------------------------------------------
  // BRANCH A: RENDER FROM CUSTOM LUMABOOTH LAYOUT TEMPLATE
  // -------------------------------------------------------------
  if (customTemplate && customTemplate.layers && customTemplate.layers.length > 0) {
    canvas.width = customTemplate.width || 600;
    canvas.height = customTemplate.height || 1800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw Background
    ctx.fillStyle = customTemplate.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render layers in order
    for (const layer of customTemplate.layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

      if (layer.rotation) {
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
      }

      if (layer.type === 'shape') {
        ctx.fillStyle = layer.fillColor || '#E0E7FF';
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        if (layer.strokeWidth && layer.strokeColor && layer.strokeColor !== 'transparent') {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
        }
      } else if (layer.type === 'photo_slot') {
        const photoIdx = (layer.photoIndex || 1) - 1;
        const photoImg = loadedPhotos[photoIdx % loadedPhotos.length];

        if (photoImg) {
          ctx.save();
          if (layer.borderRadius) {
            ctx.beginPath();
            ctx.roundRect(layer.x, layer.y, layer.width, layer.height, layer.borderRadius);
            ctx.clip();
          }
          ctx.filter = filterString;
          drawImageCover(ctx, photoImg, layer.x, layer.y, layer.width, layer.height);
          ctx.restore();

          if (layer.borderWidth && layer.borderColor) {
            ctx.strokeStyle = layer.borderColor;
            ctx.lineWidth = layer.borderWidth;
            if (layer.borderRadius) {
              ctx.beginPath();
              ctx.roundRect(layer.x, layer.y, layer.width, layer.height, layer.borderRadius);
              ctx.stroke();
            } else {
              ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
            }
          }
        }
      } else if (layer.type === 'text') {
        ctx.fillStyle = layer.fill || '#18181B';
        ctx.font = `${layer.fontWeight || 'bold'} ${layer.fontSize || 24}px "${layer.fontFamily || 'Plus Jakarta Sans'}", sans-serif`;
        ctx.textAlign = layer.textAlign || 'center';
        const textX = layer.textAlign === 'left' ? layer.x : layer.textAlign === 'right' ? layer.x + layer.width : layer.x + layer.width / 2;
        ctx.fillText(layer.text || '', textX, layer.y + (layer.height * 0.75));
      } else if (layer.type === 'session_data') {
        ctx.fillStyle = layer.fill || '#64748B';
        ctx.font = `600 ${layer.fontSize || 14}px 'JetBrains Mono', monospace`;
        ctx.textAlign = layer.textAlign || 'center';
        const textX = layer.textAlign === 'left' ? layer.x : layer.textAlign === 'right' ? layer.x + layer.width : layer.x + layer.width / 2;
        const dateStr = layer.dataField === 'date' ? (settings.eventDate || new Date().toLocaleDateString()) : settings.eventTitle;
        ctx.fillText(dateStr, textX, layer.y + (layer.height * 0.75));
      } else if (layer.type === 'qr_code') {
        try {
          const qrDataUrl = await QRCode.toDataURL(layer.qrValue || window.location.href, { width: layer.width, margin: 1 });
          const qrImg = await loadImage(qrDataUrl);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
          ctx.drawImage(qrImg, layer.x, layer.y, layer.width, layer.height);
        } catch {
          // ignore
        }
      } else if (layer.type === 'image' && layer.imageUrl) {
        try {
          const img = await loadImage(layer.imageUrl);
          drawImageCover(ctx, img, layer.x, layer.y, layer.width, layer.height);
        } catch {
          // ignore
        }
      }

      ctx.restore();
    }

    // Draw stickers if any
    stickers.forEach((sticker) => {
      ctx.save();
      const sx = (sticker.x / 100) * canvas.width;
      const sy = (sticker.y / 100) * canvas.height;
      ctx.translate(sx, sy);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.scale(sticker.scale, sticker.scale);
      if (sticker.type === 'emoji') {
        ctx.font = '64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.content, 0, 0);
      } else if (sticker.type === 'text') {
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = sticker.color || '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText(sticker.content, 0, 0);
        ctx.fillText(sticker.content, 0, 0);
      }
      ctx.restore();
    });

    return canvas.toDataURL('image/png', 0.95);
  }

  // -------------------------------------------------------------
  // BRANCH B: STANDARD STRIP FALLBACK
  // -------------------------------------------------------------
  const colors = THEME_COLORS[theme] || THEME_COLORS['classic-white'];
  let width = 600;
  let height = 1800;

  if (format === 'grid-2x2' || format === 'single') {
    width = 1200;
    height = 1800;
  } else if (format === 'strip-3') {
    width = 600;
    height = 1500;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  const photoSlots: { x: number; y: number; w: number; h: number }[] = [];
  const paddingX = Math.round(width * 0.06);
  const paddingTop = Math.round(height * 0.035);
  const footerHeight = Math.round(height * 0.13);
  const availableH = height - paddingTop - footerHeight;

  if (format === 'strip-4' || format === 'gif-burst') {
    const photoCount = 4;
    const gap = Math.round(height * 0.015);
    const photoH = (availableH - gap * (photoCount - 1)) / photoCount;
    const photoW = width - paddingX * 2;
    for (let i = 0; i < photoCount; i++) {
      photoSlots.push({ x: paddingX, y: paddingTop + i * (photoH + gap), w: photoW, h: photoH });
    }
  } else if (format === 'strip-3') {
    const photoCount = 3;
    const gap = Math.round(height * 0.018);
    const photoH = (availableH - gap * (photoCount - 1)) / photoCount;
    const photoW = width - paddingX * 2;
    for (let i = 0; i < photoCount; i++) {
      photoSlots.push({ x: paddingX, y: paddingTop + i * (photoH + gap), w: photoW, h: photoH });
    }
  } else if (format === 'grid-2x2') {
    const gap = Math.round(width * 0.03);
    const photoW = (width - paddingX * 2 - gap) / 2;
    const photoH = (availableH - gap) / 2;
    photoSlots.push({ x: paddingX, y: paddingTop, w: photoW, h: photoH });
    photoSlots.push({ x: paddingX + photoW + gap, y: paddingTop, w: photoW, h: photoH });
    photoSlots.push({ x: paddingX, y: paddingTop + photoH + gap, w: photoW, h: photoH });
    photoSlots.push({ x: paddingX + photoW + gap, y: paddingTop + photoH + gap, w: photoW, h: photoH });
  } else if (format === 'single') {
    photoSlots.push({ x: paddingX, y: paddingTop, w: width - paddingX * 2, h: availableH });
  }

  photoSlots.forEach((slot, index) => {
    const img = loadedPhotos[index % loadedPhotos.length];
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 8);
    ctx.clip();
    ctx.filter = filterString;
    drawImageCover(ctx, img, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
  });

  const footerY = height - footerHeight + 15;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.text;
  ctx.font = `700 ${Math.round(width * 0.052)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText(settings.eventTitle || 'PHOTOBOOTH STUDIO', width / 2, footerY + 32);

  if (settings.eventSubtitle) {
    ctx.fillStyle = colors.subtext;
    ctx.font = `500 ${Math.round(width * 0.034)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(settings.eventSubtitle, width / 2, footerY + 68);
  }

  if (settings.showDate) {
    ctx.fillStyle = colors.subtext;
    ctx.font = `600 ${Math.round(width * 0.028)}px 'JetBrains Mono', monospace`;
    ctx.fillText(settings.eventDate || new Date().toLocaleDateString(), width / 2, footerY + (settings.eventSubtitle ? 102 : 72));
  }
  ctx.restore();

  return canvas.toDataURL('image/png', 0.95);
}
