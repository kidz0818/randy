import { SuperChatTier } from '../types/chat';

export interface SCTierStyle {
  tier: SuperChatTier;
  headerBg: string;
  bodyBg: string;
  headerText: string;
  bodyText: string;
  defaultAmount: string;
  minAmount: number;
  glowColor: string;
  name: string;
}

export const SUPERCHAT_TIERS: Record<SuperChatTier, SCTierStyle> = {
  1: {
    tier: 1,
    headerBg: '#1565C0',
    bodyBg: '#1E88E5',
    headerText: '#FFFFFF',
    bodyText: '#FFFFFF',
    defaultAmount: '$2.00',
    minAmount: 2,
    glowColor: 'rgba(21, 101, 192, 0.6)',
    name: 'Tier 1 (深蓝 Blue)',
  },
  2: {
    tier: 2,
    headerBg: '#00838F',
    bodyBg: '#00ACC1',
    headerText: '#FFFFFF',
    bodyText: '#FFFFFF',
    defaultAmount: '$5.00',
    minAmount: 5,
    glowColor: 'rgba(0, 172, 193, 0.6)',
    name: 'Tier 2 (青蓝 Cyan)',
  },
  3: {
    tier: 3,
    headerBg: '#00BFA5',
    bodyBg: '#1DE9B6',
    headerText: '#004D40',
    bodyText: '#004D40',
    defaultAmount: '$10.00',
    minAmount: 10,
    glowColor: 'rgba(0, 191, 165, 0.6)',
    name: 'Tier 3 (翠绿 Green)',
  },
  4: {
    tier: 4,
    headerBg: '#FFB300',
    bodyBg: '#FFCA28',
    headerText: '#3E2723',
    bodyText: '#3E2723',
    defaultAmount: '$20.00',
    minAmount: 20,
    glowColor: 'rgba(255, 179, 0, 0.6)',
    name: 'Tier 4 (亮黄 Yellow)',
  },
  5: {
    tier: 5,
    headerBg: '#E65100',
    bodyBg: '#F57C00',
    headerText: '#FFFFFF',
    bodyText: '#FFFFFF',
    defaultAmount: '$50.00',
    minAmount: 50,
    glowColor: 'rgba(230, 81, 0, 0.7)',
    name: 'Tier 5 (暖橙 Orange)',
  },
  6: {
    tier: 6,
    headerBg: '#C2185B',
    bodyBg: '#E91E63',
    headerText: '#FFFFFF',
    bodyText: '#FFFFFF',
    defaultAmount: '$100.00',
    minAmount: 100,
    glowColor: 'rgba(233, 30, 99, 0.8)',
    name: 'Tier 6 (洋红 Magenta)',
  },
  7: {
    tier: 7,
    headerBg: '#D00000',
    bodyBg: '#E53935',
    headerText: '#FFFFFF',
    bodyText: '#FFFFFF',
    defaultAmount: '$500.00',
    minAmount: 500,
    glowColor: 'rgba(229, 57, 53, 0.9)',
    name: 'Tier 7 (爆红/彩虹 Red SuperChat)',
  },
};

export const AVATAR_PRESETS = [
  {
    id: 'streamer-1',
    name: 'Sakura VTuber',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    id: 'streamer-2',
    name: 'Cyber Boy',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    id: 'streamer-3',
    name: 'Gamer Girl',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    id: 'streamer-4',
    name: 'Golden Whale',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    id: 'streamer-5',
    name: 'Neko Cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    id: 'streamer-6',
    name: 'Hype Moderator',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  },
];
