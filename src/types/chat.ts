export type SuperChatTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type BubbleType = 'normal' | 'member' | 'superchat' | 'sticker';

export type EntranceEffect = 
  | 'slide-right'
  | 'slide-left'
  | 'slide-bottom'
  | 'bounce-pop'
  | 'superchat-flare'
  | 'confetti-burst'
  | 'coin-fountain'
  | 'cyber-glitch'
  | 'flame-aura'
  | 'floating-fade';

export type BadgeType = 'none' | 'member' | 'moderator' | 'verified' | 'creator' | 'custom';

export interface ChatBadge {
  type: BadgeType;
  label?: string;
  icon?: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatarUrl: string;
  badge?: ChatBadge;
  type: BubbleType;
  // Superchat specific fields
  scTier?: SuperChatTier;
  amount?: string;
  currency?: string;
  // Content
  message: string;
  stickerUrl?: string;
  // Animation settings
  entranceEffect: EntranceEffect;
  entranceDuration: number; // in seconds, e.g. 0.5
  dwellTime?: number; // how long to stay before fade (0 = permanent until pushed off)
  // Timestamp / Timeline trigger
  timestamp?: number;
  delayBeforeNext?: number; // delay in seconds before next message in script
  // Visual style customizations
  customBgColor?: string;
  customTextColor?: string;
  customHeaderColor?: string;
}

export interface PlaybackSettings {
  speed: number; // 0.5x to 2x
  entranceDurationScale: number; // multiplier for entrance animations
  entryInterval: number; // seconds between auto-playing messages
  maxVisibleBubbles: number; // max bubbles on stage (e.g. 15)
  bubbleSpacing: number; // px between bubbles
  scrollDirection: 'bottom-to-top' | 'top-to-bottom';
  align: 'left' | 'center' | 'right';
  bubbleMaxWidth: number; // strict max 512px, default 480px or 500px
  bubbleScale: number; // multiplier for bubble size (1.0x to 1.8x), default 1.35x
  fontSize: number; // default 16px
  showShadows: boolean;
  enableVfxParticles: boolean;
  bgMode: 'transparent' | 'dark' | 'green' | 'light';
  autoFadeAfterSeconds: number; // 0 = don't auto fade
}

export interface ExportSettings {
  format: 'webm-alpha' | 'png-sequence' | 'chroma-green';
  fps: 30 | 60;
  durationMode: 'script' | 'custom';
  customDurationSeconds: number;
}
