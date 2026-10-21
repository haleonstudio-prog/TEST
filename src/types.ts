/**
 * Photobooth Studio Types & Models
 * Supports LumaBooth / dslrBooth-style Events & WYSIWYG Template Editor
 */

export type LayoutFormat = 'strip-4' | 'strip-3' | 'grid-2x2' | 'single' | 'gif-burst';

export type PaperSize = '2x6' | '4x6' | '5x7' | '6x8' | 'square';

export type FilterType = 
  | 'normal' 
  | 'warm-vintage' 
  | 'bw-contrast' 
  | 'tokyo-pastel' 
  | 'cyber-neon' 
  | 'sepia' 
  | 'soft-glow' 
  | 'film-grain';

export type FrameTheme = 
  | 'classic-white' 
  | 'matte-black' 
  | 'vintage-cream' 
  | 'blush-pink' 
  | 'midnight-navy' 
  | 'cyber-purple' 
  | 'golden-hour' 
  | 'checkerboard';

export interface StickerItem {
  id: string;
  type: 'emoji' | 'text' | 'badge';
  content: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number; // 0.5 to 2.0
  rotation: number; // -180 to 180 degrees
  color?: string;
}

// -------------------------------------------------------------
// LUMABOOTH PHOTO LAYOUT EDITOR TYPES
// -------------------------------------------------------------

export type LayerType = 'photo_slot' | 'image' | 'text' | 'shape' | 'qr_code' | 'session_data';

export interface TemplateLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0 to 1
  visible: boolean;
  locked?: boolean;
  
  // Photo slot specific
  photoIndex?: number; // 1, 2, 3, 4
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;

  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';

  // Image specific
  imageUrl?: string;

  // Shape specific
  shapeType?: 'rectangle' | 'circle' | 'line';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;

  // QR Code specific
  qrValue?: string;

  // Session Data specific
  dataField?: 'date' | 'time' | 'filename' | 'event_name';
}

export interface LayoutTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  width: number; // canvas logical coordinate width (e.g. 600 for 2x6, 1200 for 4x6)
  height: number; // canvas logical coordinate height (e.g. 1800 for 2x6)
  backgroundColor: string;
  backgroundImageUrl?: string;
  print2PerPage: boolean;
  layers: TemplateLayer[];
}

// -------------------------------------------------------------
// LUMABOOTH EVENT DATA MODEL
// -------------------------------------------------------------

export interface EventItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  selectedTemplateId: string;
  templates: LayoutTemplate[];
  captureModes: {
    photo: boolean;
    gif: boolean;
    boomerang: boolean;
    video: boolean;
  };
  features: {
    aiPortraits: boolean;
    effects: boolean;
    digitalProps: boolean;
    beautyFilter: boolean;
    watermark: boolean;
    postProcessing: boolean;
    disclaimer: boolean;
    backgroundRemoval: boolean;
    survey: boolean;
  };
  printing: {
    printAutomatically: boolean;
    displayPrintButton: boolean;
    mainPrinter: string;
    secondaryPrinter: string;
    print2PerPage: boolean;
    paperSize: PaperSize;
  };
  sharing: {
    email: boolean;
    replyTo: string;
    emailSubject: string;
    sms: boolean;
    countryCode: string;
    smsMessage: string;
  };
}

export interface PhotoboothSettings {
  eventTitle: string;
  eventSubtitle: string;
  showDate: boolean;
  eventDate: string;
  countdownSeconds: number; // 3, 5, or 10
  mirrorCamera: boolean;
  soundEnabled: boolean;
  flashEnabled: boolean;
  autoPrint: boolean;
  cameraResolution: '1080p' | '720p' | '4k';
  printerName: string;
  paperType: '2x6-strip' | '4x6-postcard';
  copiesPerSession: number;
  kioskPin: string;
  kioskLock: boolean;
}

export interface SessionPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export interface HistoryStrip {
  id: string;
  timestamp: number;
  previewUrl: string;
  format: LayoutFormat;
  filter: FilterType;
  theme: FrameTheme;
  photoCount: number;
}

export type AppTab = 'events' | 'layout-editor' | 'kiosk' | 'python-source' | 'gallery' | 'settings';
