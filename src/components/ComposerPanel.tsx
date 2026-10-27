import React, { useState } from 'react';
import { BubbleType, ChatMessage, EntranceEffect, SuperChatTier, BadgeType } from '../types/chat';
import { SUPERCHAT_TIERS, AVATAR_PRESETS } from '../utils/superchat';
import {
  Send,
  PlusCircle,
  Upload,
  Sparkles,
  Zap,
  Flame,
  Coins,
  PartyPopper,
  Radio,
  Dices,
} from 'lucide-react';

interface ComposerPanelProps {
  onTriggerLive: (message: ChatMessage) => void;
  onAddToTimeline: (message: ChatMessage) => void;
}

export const ComposerPanel: React.FC<ComposerPanelProps> = ({
  onTriggerLive,
  onAddToTimeline,
}) => {
  const [username, setUsername] = useState('Sakura Chan');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0].url);
  const [messageText, setMessageText] = useState('感谢主播！今天的直播太精彩啦！🎉');
  const [bubbleType, setBubbleType] = useState<BubbleType>('superchat');
  const [scTier, setScTier] = useState<SuperChatTier>(5);
  const [customAmount, setCustomAmount] = useState('$50.00');
  const [badgeType, setBadgeType] = useState<BadgeType>('member');
  const [customBadgeLabel, setCustomBadgeLabel] = useState('TOP MEMBER');
  const [entranceEffect, setEntranceEffect] = useState<EntranceEffect>('confetti-burst');
  const [entranceDuration, setEntranceDuration] = useState(0.5);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTierSelect = (tier: SuperChatTier) => {
    setScTier(tier);
    setBubbleType('superchat');
    setCustomAmount(SUPERCHAT_TIERS[tier].defaultAmount);
    // Auto-pick exciting VFX for higher tiers
    if (tier >= 6) {
      setEntranceEffect('confetti-burst');
    } else if (tier >= 4) {
      setEntranceEffect('coin-fountain');
    } else {
      setEntranceEffect('superchat-flare');
    }
  };

  const buildCurrentMessage = (): ChatMessage => {
    const badge =
      badgeType === 'none'
        ? undefined
        : {
            type: badgeType,
            label:
              badgeType === 'custom'
                ? customBadgeLabel
                : badgeType === 'member'
                ? 'MEMBER'
                : badgeType === 'moderator'
                ? 'MOD'
                : badgeType === 'verified'
                ? 'VERIFIED'
                : 'TOP DONOR',
          };

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: username.trim() || 'Anonymous',
      avatarUrl,
      badge,
      type: bubbleType,
      scTier: bubbleType === 'superchat' ? scTier : undefined,
      amount: bubbleType === 'superchat' ? customAmount : undefined,
      message: messageText.trim(),
      entranceEffect,
      entranceDuration,
      delayBeforeNext: 1.2,
    };
  };

  const handleSendNow = () => {
    const msg = buildCurrentMessage();
    onTriggerLive(msg);
  };

  const handleAddTimeline = () => {
    const msg = buildCurrentMessage();
    onAddToTimeline(msg);
  };

  const handleRandomize = () => {
    const randomNames = ['星空漫步者', 'Aki_VT', '打赏狂魔小王', 'GamingLegend', 'NekoKawaii', '柴犬队长'];
    const randomMessages = [
      '主播太强了！必须来发红SC！🔥🔥',
      '拿去买奶茶喝！喝大杯无糖！🥤',
      '哈哈哈哈这个操作神了！',
      '恭喜突破十万粉！未来可期！🎊',
      '晚上好！今天刚下班就赶过来了~',
      '全场最佳！给大哥递烟！',
    ];
    setUsername(randomNames[Math.floor(Math.random() * randomNames.length)]);
    setMessageText(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
    const randomAvatar = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
    setAvatarUrl(randomAvatar.url);
    const randomTiers: SuperChatTier[] = [3, 4, 5, 6, 7];
    handleTierSelect(randomTiers[Math.floor(Math.random() * randomTiers.length)]);
  };

  const effectOptions: { id: EntranceEffect; label: string; icon: React.ReactNode }[] = [
    { id: 'confetti-burst', label: '彩带礼炮 (Confetti)', icon: <PartyPopper className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'coin-fountain', label: '金币喷泉 (Coins)', icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'superchat-flare', label: '豪华高光 (Flare)', icon: <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> },
    { id: 'bounce-pop', label: '弹跳登场 (Bounce)', icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'cyber-glitch', label: '赛博霓虹 (Glitch)', icon: <Radio className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'flame-aura', label: '火焰狂热 (Flame)', icon: <Flame className="w-3.5 h-3.5 text-orange-500" /> },
    { id: 'slide-right', label: '右侧滑入 (Right)', icon: <span className="text-xs">➡️</span> },
    { id: 'slide-left', label: '左侧滑入 (Left)', icon: <span className="text-xs">⬅️</span> },
    { id: 'slide-bottom', label: '底部升起 (Bottom)', icon: <span className="text-xs">⬆️</span> },
    { id: 'floating-fade', label: '轻盈浮动 (Float)', icon: <span className="text-xs">☁️</span> },
  ];

  return (
    <div className="space-y-4 text-sm text-zinc-200">
      {/* Header with Quick Random Fill */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">气泡自定义编辑器 (Composer)</span>
        </div>
        <button
          onClick={handleRandomize}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="随机生成一套有趣的内容"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>随机样本</span>
        </button>
      </div>

      {/* Bubble Style Mode Tabs */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          气泡类型 (Bubble Style)
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setBubbleType('superchat')}
            className={`py-1.5 px-2 rounded-lg font-medium text-xs transition-all ${
              bubbleType === 'superchat'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔥 YouTube 打赏 (SC)
          </button>
          <button
            type="button"
            onClick={() => setBubbleType('member')}
            className={`py-1.5 px-2 rounded-lg font-medium text-xs transition-all ${
              bubbleType === 'member'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            👑 会员通知 (Member)
          </button>
          <button
            type="button"
            onClick={() => setBubbleType('normal')}
            className={`py-1.5 px-2 rounded-lg font-medium text-xs transition-all ${
              bubbleType === 'normal'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💬 普通弹幕 (Chat)
          </button>
        </div>
      </div>

      {/* SuperChat Tiers Selector (If SC mode) */}
      {bubbleType === 'superchat' && (
        <div className="space-y-2 p-3 rounded-xl bg-zinc-900/70 border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-300">SuperChat 等级档次 (YouTube Tiers)</span>
            <span className="font-mono font-bold text-amber-400">{customAmount}</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {([1, 2, 3, 4, 5, 6, 7] as SuperChatTier[]).map((tier) => {
              const info = SUPERCHAT_TIERS[tier];
              const isSelected = scTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleTierSelect(tier)}
                  className={`h-9 rounded-lg flex flex-col items-center justify-center font-bold text-[11px] transition-all cursor-pointer relative ${
                    isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-lg' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: info.headerBg,
                    color: info.headerText,
                  }}
                  title={info.name}
                >
                  <span>T{tier}</span>
                  <span className="text-[9px] font-normal leading-none">{info.defaultAmount}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount input */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-zinc-400 shrink-0">自定义金额:</span>
            <input
              type="text"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="$50.00 or NT$1,500"
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      )}

      {/* Username & Badge Row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="输入昵称..."
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">专属徽章 (Badge)</label>
          <select
            value={badgeType}
            onChange={(e) => setBadgeType(e.target.value as BadgeType)}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="none">无徽章</option>
            <option value="member">👑 专属会员 (Member)</option>
            <option value="moderator">🛡️ 房管 (Moderator)</option>
            <option value="verified">⭐ 认证大V (Verified)</option>
            <option value="creator">⚡ 头号榜首 (Top Donor)</option>
            <option value="custom">✏️ 自定义标签</option>
          </select>
        </div>
      </div>

      {badgeType === 'custom' && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">自定义徽章文字</label>
          <input
            type="text"
            value={customBadgeLabel}
            onChange={(e) => setCustomBadgeLabel(e.target.value)}
            placeholder="如: 6年老粉, VIP等"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {/* Custom Avatar Section */}
      <div className="space-y-2 p-3 rounded-xl bg-zinc-900/60 border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-300">自定义头像 (Avatar)</span>
          <label className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium">
            <Upload className="w-3.5 h-3.5" />
            <span>本地上传图片</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Avatar Preset Grid */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = avatarUrl === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setAvatarUrl(preset.url)}
                className={`relative shrink-0 rounded-full transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-indigo-400 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                }`}
                title={preset.name}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>
            );
          })}
        </div>

        {/* Direct Image URL input */}
        <input
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="或输入图片URL网址..."
          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-zinc-300 font-mono focus:outline-none focus:border-indigo-400"
        />
      </div>

      {/* Message Text Input */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          气泡说话文字 (Message Text)
        </label>
        <textarea
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="想让气泡说什么？支持多行输入..."
          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
        />
      </div>

      {/* Entrance Effect (入场特效) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-300">入场特效 (Entrance VFX)</span>
          <span className="text-[11px] text-zinc-500 font-mono">动画时长: {entranceDuration}s</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {effectOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setEntranceEffect(opt.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                entranceEffect === opt.id
                  ? 'bg-indigo-600/30 border border-indigo-400 text-white shadow'
                  : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {opt.icon}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons - Sticky at bottom for quick access */}
      <div className="sticky bottom-0 -mx-4 -mb-4 p-3 bg-zinc-950/95 backdrop-blur-md border-t border-white/10 grid grid-cols-2 gap-2 z-20 shadow-xl">
        <button
          type="button"
          onClick={handleSendNow}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>立即发送到舞台</span>
        </button>

        <button
          type="button"
          onClick={handleAddTimeline}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>加入剧本时间轴</span>
        </button>
      </div>
    </div>
  );
};
