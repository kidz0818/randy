import React from 'react';
import { ChatMessage, EntranceEffect } from '../types/chat';
import { SUPERCHAT_TIERS } from '../utils/superchat';
import { ShieldCheck, Star, Award, Zap } from 'lucide-react';

interface BubbleCardProps {
  message: ChatMessage;
  scale?: number;
  entranceScale?: number;
  isExiting?: boolean;
}

export const BubbleCard: React.FC<BubbleCardProps> = ({
  message,
  scale = 1.35,
  entranceScale = 1,
  isExiting = false,
}) => {
  const {
    username,
    avatarUrl,
    badge,
    type,
    scTier = 3,
    amount,
    message: text,
    entranceEffect = 'slide-right',
    entranceDuration = 0.5,
  } = message;

  const tierStyle = SUPERCHAT_TIERS[scTier] || SUPERCHAT_TIERS[3];
  const effectiveDuration = Math.max(0.1, entranceDuration * entranceScale);

  // Scaled dimensions
  const s = Math.max(0.8, Math.min(2.0, scale));
  const avatarPx = Math.round(40 * s);
  const usernamePx = Math.round(13.5 * s);
  const messagePx = Math.round(13.5 * s);
  const amountPx = Math.round(15 * s);
  const padX = Math.round(14 * s);
  const padY = Math.round(10 * s);

  // Determine animation class
  const getAnimationClass = (effect: EntranceEffect) => {
    switch (effect) {
      case 'slide-right':
        return 'animate-slide-in-right';
      case 'slide-left':
        return 'animate-slide-in-left';
      case 'slide-bottom':
        return 'animate-slide-in-bottom';
      case 'bounce-pop':
        return 'animate-bounce-pop';
      case 'superchat-flare':
        return 'animate-sc-flare';
      case 'confetti-burst':
        return 'animate-confetti-pop';
      case 'coin-fountain':
        return 'animate-coin-pop';
      case 'cyber-glitch':
        return 'animate-cyber-glitch';
      case 'flame-aura':
        return 'animate-flame-pulse';
      case 'floating-fade':
        return 'animate-floating-fade';
      default:
        return 'animate-slide-in-right';
    }
  };

  const renderBadge = () => {
    if (!badge || badge.type === 'none') return null;

    const badgeStyle: React.CSSProperties = {
      fontSize: `${Math.round(10 * s)}px`,
      padding: `${Math.round(2 * s)}px ${Math.round(6 * s)}px`,
    };
    const iconSize = Math.max(12, Math.round(12 * s));

    if (badge.type === 'moderator') {
      return (
        <span
          style={badgeStyle}
          className="inline-flex items-center gap-1 rounded-md font-bold bg-blue-600 text-white shadow"
        >
          <ShieldCheck style={{ width: iconSize, height: iconSize }} />
          <span>{badge.label || 'MOD'}</span>
        </span>
      );
    }
    if (badge.type === 'member') {
      return (
        <span
          style={badgeStyle}
          className="inline-flex items-center gap-1 rounded-md font-bold bg-emerald-600 text-white shadow"
        >
          <Award style={{ width: iconSize, height: iconSize }} />
          <span>{badge.label || 'MEMBER'}</span>
        </span>
      );
    }
    if (badge.type === 'verified') {
      return (
        <span
          style={badgeStyle}
          className="inline-flex items-center gap-1 rounded-md font-bold bg-amber-500 text-white shadow"
        >
          <Star style={{ width: iconSize, height: iconSize }} className="fill-white" />
          <span>{badge.label || 'VERIFIED'}</span>
        </span>
      );
    }
    if (badge.type === 'creator') {
      return (
        <span
          style={badgeStyle}
          className="inline-flex items-center gap-1 rounded-md font-bold bg-rose-600 text-white shadow"
        >
          <Zap style={{ width: iconSize, height: iconSize }} className="fill-white" />
          <span>{badge.label || 'TOP DONOR'}</span>
        </span>
      );
    }
    return (
      <span
        style={{ ...badgeStyle, backgroundColor: badge.color || '#6366F1' }}
        className="inline-flex items-center rounded-md font-semibold text-white shadow"
      >
        {badge.label || 'VIP'}
      </span>
    );
  };

  const isRainbow = type === 'superchat' && scTier === 7;

  return (
    <div
      className={`relative w-full max-w-[504px] my-1.5 transition-all select-none box-border ${
        isExiting ? 'opacity-0 scale-95 duration-500' : getAnimationClass(entranceEffect)
      }`}
      style={{
        animationDuration: `${effectiveDuration}s`,
        animationFillMode: 'both',
      }}
    >
      {type === 'superchat' ? (
        /* YouTube SuperChat Style Card - Big & Bold */
        <div
          className={`rounded-2xl overflow-hidden shadow-2xl border transition-all ${
            isRainbow
              ? 'ring-3 ring-amber-300 shadow-[0_0_35px_rgba(255,215,0,0.6)] border-amber-300/80'
              : 'border-white/15'
          }`}
          style={{
            boxShadow: `0 10px 35px ${tierStyle.glowColor}`,
          }}
        >
          {/* SuperChat Header */}
          <div
            className="flex items-center justify-between gap-3 relative overflow-hidden"
            style={{
              backgroundColor: tierStyle.headerBg,
              color: tierStyle.headerText,
              padding: `${padY}px ${padX}px`,
            }}
          >
            {/* Shimmer light effect for Tier 5+ */}
            {scTier >= 5 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
            )}

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                  alt={username}
                  style={{ width: `${avatarPx}px`, height: `${avatarPx}px` }}
                  className="rounded-full object-cover ring-2 ring-white/90 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(username);
                  }}
                />
                {isRainbow && (
                  <span
                    style={{
                      width: `${Math.round(18 * s)}px`,
                      height: `${Math.round(18 * s)}px`,
                      fontSize: `${Math.round(11 * s)}px`,
                    }}
                    className="absolute -top-1 -right-1 bg-amber-400 rounded-full flex items-center justify-center text-zinc-900 font-black shadow-lg"
                  >
                    ★
                  </span>
                )}
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    style={{ fontSize: `${usernamePx}px` }}
                    className="font-bold tracking-wide truncate max-w-[220px]"
                  >
                    {username}
                  </span>
                  {renderBadge()}
                </div>
                <span
                  style={{ fontSize: `${Math.max(10, Math.round(11 * s))}px` }}
                  className="opacity-90 font-semibold mt-0.5 tracking-wider"
                >
                  SuperChat
                </span>
              </div>
            </div>

            {/* Donation Amount Badge */}
            <div className="shrink-0 flex items-center gap-1 text-right">
              <div
                className="rounded-full font-black tracking-tight shadow-md"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.22)',
                  color: tierStyle.headerText,
                  fontSize: `${amountPx}px`,
                  padding: `${Math.round(4 * s)}px ${Math.round(12 * s)}px`,
                }}
              >
                {amount || tierStyle.defaultAmount}
              </div>
            </div>
          </div>

          {/* SuperChat Message Body */}
          {text && (
            <div
              style={{
                backgroundColor: tierStyle.bodyBg,
                color: tierStyle.bodyText,
                fontSize: `${messagePx}px`,
                padding: `${Math.round(padY * 1.1)}px ${padX}px`,
              }}
              className="font-medium leading-relaxed break-words shadow-inner"
            >
              {text}
            </div>
          )}
        </div>
      ) : type === 'member' ? (
        /* YouTube Membership Announcement */
        <div
          style={{ padding: `${padY}px ${padX}px` }}
          className="rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-100 shadow-2xl flex items-start gap-3.5"
        >
          <img
            src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
            alt={username}
            style={{ width: `${avatarPx}px`, height: `${avatarPx}px` }}
            className="rounded-full object-cover ring-2 ring-emerald-400/80 shrink-0 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                style={{ fontSize: `${usernamePx}px` }}
                className="font-bold text-emerald-300 truncate"
              >
                {username}
              </span>
              {renderBadge()}
            </div>
            <div
              style={{ fontSize: `${messagePx}px` }}
              className="font-normal text-white/95 break-words leading-relaxed"
            >
              {text}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Livestream Chat Bubble */
        <div
          style={{ padding: `${padY}px ${padX}px` }}
          className="rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-white/15 text-white shadow-2xl hover:border-white/30 transition-all flex items-start gap-3.5"
        >
          <img
            src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
            alt={username}
            style={{ width: `${avatarPx}px`, height: `${avatarPx}px` }}
            className="rounded-full object-cover ring-2 ring-white/40 shrink-0 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                style={{ fontSize: `${usernamePx}px` }}
                className="font-bold text-sky-400 truncate"
              >
                {username}
              </span>
              {renderBadge()}
            </div>
            <div
              style={{ fontSize: `${messagePx}px` }}
              className="text-zinc-100 break-words leading-relaxed"
            >
              {text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
