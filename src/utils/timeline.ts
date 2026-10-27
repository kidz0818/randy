import { ChatMessage, EntranceEffect, SuperChatTier } from '../types/chat';

export interface ParsedScriptLine {
  username: string;
  message: string;
  amount?: string;
  tier?: SuperChatTier;
  effect?: EntranceEffect;
  delay?: number;
}

/**
 * Calculates effective duration based on speed multiplier.
 */
export function calculateEffectiveDuration(baseDuration: number, speed: number): number {
  if (speed <= 0) return baseDuration;
  return Math.max(0.05, baseDuration / speed);
}

/**
 * Calculates the total timeline runtime in seconds for a list of messages.
 */
export function calculateTotalRuntime(messages: ChatMessage[], speedMultiplier = 1, defaultInterval = 1.2): number {
  if (!messages || messages.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const delay = msg.delayBeforeNext !== undefined ? msg.delayBeforeNext : defaultInterval;
    total += calculateEffectiveDuration(delay, speedMultiplier);
  }
  // add a tail buffer of 2s for last entrance animation & readability
  total += calculateEffectiveDuration(2.0, speedMultiplier);
  return Number(total.toFixed(2));
}

/**
 * Parses user input text script into structured ChatMessage items.
 * Supports syntax like:
 * [Alice] Hello chat!
 * [Bob:SC5:$50] Wow thanks for the stream!
 * [Charlie:MEMBER] Super hyped today!
 */
export function parseScriptText(text: string): Partial<ChatMessage>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results: Partial<ChatMessage>[] = [];

  for (const line of lines) {
    // Check for [Username:Tag:Amount] Message
    const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (match) {
      const headerParts = match[1].split(':').map(p => p.trim());
      const username = headerParts[0] || 'User';
      const content = match[2] || '';
      
      let type: ChatMessage['type'] = 'normal';
      let scTier: SuperChatTier | undefined = undefined;
      let amount: string | undefined = undefined;
      let badge = undefined;

      for (let i = 1; i < headerParts.length; i++) {
        const part = headerParts[i];
        if (/^SC([1-7])$/i.test(part)) {
          type = 'superchat';
          scTier = Number(part.replace(/[^1-7]/g, '')) as SuperChatTier;
        } else if (part.startsWith('$') || part.startsWith('¥') || part.startsWith('NT$') || /^\d+/.test(part)) {
          amount = part;
          if (type !== 'superchat') type = 'superchat';
        } else if (/^MEMBER$/i.test(part)) {
          type = 'member';
          badge = { type: 'member' as const, label: 'VIP Member', color: '#10B981' };
        } else if (/^MOD$/i.test(part)) {
          badge = { type: 'moderator' as const, label: 'MOD', color: '#3B82F6' };
        }
      }

      // Default amount if superchat without amount
      if (type === 'superchat' && !amount) {
        amount = scTier ? `$${scTier * 10}.00` : '$10.00';
      }
      if (type === 'superchat' && !scTier) {
        scTier = 3;
      }

      results.push({
        username,
        message: content,
        type,
        scTier,
        amount,
        badge,
        entranceEffect: type === 'superchat' ? (scTier && scTier >= 5 ? 'confetti-burst' : 'superchat-flare') : 'slide-right',
        entranceDuration: 0.5,
        delayBeforeNext: 1.2,
      });
    } else {
      // Simple line without brackets
      results.push({
        username: 'Viewer',
        message: line,
        type: 'normal',
        entranceEffect: 'slide-right',
        entranceDuration: 0.4,
        delayBeforeNext: 1.0,
      });
    }
  }

  return results;
}

/**
 * Parses user input JSON string (file or text) into validated ChatMessage items.
 * Accepts either an Array of items or an Object containing `messages` / `timeline` / `bubbles`.
 */
export function parseJsonScript(jsonString: string): ChatMessage[] {
  if (!jsonString || !jsonString.trim()) {
    throw new Error('JSON 内容为空，请输入或上传有效的 JSON 数据。');
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('JSON 格式解析错误，请检查语法（如引号、逗号、括号等）: ' + (e as Error).message);
  }

  let itemsArray: unknown[] = [];
  if (Array.isArray(data)) {
    itemsArray = data;
  } else if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.messages)) {
      itemsArray = record.messages;
    } else if (Array.isArray(record.timeline)) {
      itemsArray = record.timeline;
    } else if (Array.isArray(record.bubbles)) {
      itemsArray = record.bubbles;
    } else {
      throw new Error('未在 JSON 对象中找到 messages, timeline 或 bubbles 数组。');
    }
  } else {
    throw new Error('JSON 数据必须是气泡数组或包含 messages 的对象。');
  }

  if (itemsArray.length === 0) {
    throw new Error('JSON 中的气泡列表为空。');
  }

  const validEffects: EntranceEffect[] = [
    'slide-right',
    'slide-left',
    'slide-bottom',
    'bounce-pop',
    'superchat-flare',
    'confetti-burst',
    'coin-fountain',
    'cyber-glitch',
    'flame-aura',
    'floating-fade',
  ];

  const defaultAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80';

  return itemsArray.map((raw, idx) => {
    const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const id = typeof item.id === 'string' && item.id ? item.id : `json-${Date.now()}-${idx}`;
    const username = typeof item.username === 'string' && item.username.trim() ? item.username.trim() : `Viewer_${idx + 1}`;
    const message = typeof item.message === 'string' ? item.message : String(item.text || item.content || '');
    
    let type: ChatMessage['type'] = 'normal';
    if (item.type === 'superchat' || item.type === 'member') {
      type = item.type;
    } else if (item.amount || item.scTier) {
      type = 'superchat';
    }

    const scTier = typeof item.scTier === 'number' && item.scTier >= 1 && item.scTier <= 7
      ? (item.scTier as SuperChatTier)
      : type === 'superchat' ? 3 : undefined;

    const amount = typeof item.amount === 'string' ? item.amount : (type === 'superchat' ? `$${(scTier || 3) * 10}.00` : undefined);

    const entranceEffect: EntranceEffect = validEffects.includes(item.entranceEffect as EntranceEffect)
      ? (item.entranceEffect as EntranceEffect)
      : type === 'superchat' ? 'superchat-flare' : 'slide-right';

    const entranceDuration = typeof item.entranceDuration === 'number' && item.entranceDuration > 0
      ? item.entranceDuration
      : 0.5;

    const delayBeforeNext = typeof item.delayBeforeNext === 'number' && item.delayBeforeNext >= 0.1
      ? item.delayBeforeNext
      : 1.2;

    const avatarUrl = typeof item.avatarUrl === 'string' && item.avatarUrl ? item.avatarUrl : defaultAvatar;

    return {
      id,
      username,
      message,
      type,
      scTier,
      amount,
      badge: typeof item.badge === 'object' && item.badge !== null ? (item.badge as ChatMessage['badge']) : undefined,
      avatarUrl,
      entranceEffect,
      entranceDuration,
      delayBeforeNext,
      customBgColor: typeof item.customBgColor === 'string' ? item.customBgColor : undefined,
      customTextColor: typeof item.customTextColor === 'string' ? item.customTextColor : undefined,
    };
  });
}

export const PRESET_SCRIPTS = [
  {
    id: 'superchat-shower',
    title: '🔥 YouTube 豪华彩虹 SC 轰炸 (Hype SuperChat Rush)',
    description: '模拟知名主播收到连续大额打赏，包含金币喷泉、彩带爆炸、彩虹最高档 SC 震撼登场。',
    messages: [
      {
        id: 'sc-p-1',
        username: '星野喵喵 (Member 12mo)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        badge: { type: 'member' as const, label: '👑 黄金会员', color: '#10B981' },
        type: 'member' as const,
        message: '主播晚上好！今天的开场太棒啦！✨',
        entranceEffect: 'slide-bottom' as const,
        entranceDuration: 0.4,
        delayBeforeNext: 0.8,
      },
      {
        id: 'sc-p-2',
        username: 'Cyber_Knight',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
        badge: { type: 'moderator' as const, label: 'MOD', color: '#3B82F6' },
        type: 'superchat' as const,
        scTier: 3 as SuperChatTier,
        amount: '$10.00',
        message: '祝贺直播间达成 100,000 订阅！今晚不醉不归！🎉',
        entranceEffect: 'superchat-flare' as const,
        entranceDuration: 0.5,
        delayBeforeNext: 1.0,
      },
      {
        id: 'sc-p-3',
        username: 'GoldWhale99',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        badge: { type: 'verified' as const, label: 'Verified Whale', color: '#F59E0B' },
        type: 'superchat' as const,
        scTier: 5 as SuperChatTier,
        amount: '$50.00',
        message: '拿去买夜宵！记得喝水保护嗓子哦！🍕🥤',
        entranceEffect: 'coin-fountain' as const,
        entranceDuration: 0.6,
        delayBeforeNext: 1.2,
      },
      {
        id: 'sc-p-4',
        username: 'Aoi_Akira',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
        type: 'normal' as const,
        message: '草，大佬来了！给大佬递茶 🍵',
        entranceEffect: 'bounce-pop' as const,
        entranceDuration: 0.35,
        delayBeforeNext: 0.6,
      },
      {
        id: 'sc-p-5',
        username: 'SuperDanmu_Master',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        badge: { type: 'creator' as const, label: '⚡ TOP DONOR', color: '#EF4444' },
        type: 'superchat' as const,
        scTier: 7 as SuperChatTier,
        amount: '$500.00',
        message: '全场起立！这是今晚最高规格的赤字彩虹 SuperChat！继续冲！🔥🔥🔥',
        entranceEffect: 'confetti-burst' as const,
        entranceDuration: 0.8,
        delayBeforeNext: 1.8,
      },
      {
        id: 'sc-p-6',
        username: 'KittenLover',
        avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&h=150&q=80',
        type: 'normal' as const,
        message: '7777777777 满屏红SC太帅了！',
        entranceEffect: 'slide-right' as const,
        entranceDuration: 0.3,
        delayBeforeNext: 1.0,
      },
    ],
  },
  {
    id: 'esports-hype',
    title: '⚡ 电竞赛事五杀高潮弹幕 (Esports Pentakill Hype)',
    description: '快速进入的比赛喝彩弹幕与霓虹特效，适合高燃精彩剪辑。',
    messages: [
      {
        id: 'esp-1',
        username: 'LeagueCaster',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        badge: { type: 'verified' as const, label: 'Official Cast' },
        type: 'normal' as const,
        message: '团战一触即发！双方在中路河道遭遇！',
        entranceEffect: 'slide-right' as const,
        entranceDuration: 0.3,
        delayBeforeNext: 0.5,
      },
      {
        id: 'esp-2',
        username: 'ViperFan',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
        type: 'normal' as const,
        message: '大招拉到了五个！这波要翻盘了！',
        entranceEffect: 'bounce-pop' as const,
        entranceDuration: 0.3,
        delayBeforeNext: 0.4,
      },
      {
        id: 'esp-3',
        username: 'PentakillHunter',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        type: 'superchat' as const,
        scTier: 6 as SuperChatTier,
        amount: '$100.00',
        message: 'PENTAKILL!!!!! 载入史册的一战！🏆',
        entranceEffect: 'flame-aura' as const,
        entranceDuration: 0.6,
        delayBeforeNext: 0.8,
      },
      {
        id: 'esp-4',
        username: 'CyberNinja',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
        type: 'normal' as const,
        message: '封神！彻底封神！！！！！',
        entranceEffect: 'cyber-glitch' as const,
        entranceDuration: 0.3,
        delayBeforeNext: 0.5,
      },
    ],
  },
];
