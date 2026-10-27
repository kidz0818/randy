import React from 'react';
import { PlaybackSettings } from '../types/chat';
import { Gauge, Sliders, ShieldAlert, Sparkles, Layers, Eye, Maximize2 } from 'lucide-react';

interface SpeedSettingsPanelProps {
  settings: PlaybackSettings;
  setSettings: React.Dispatch<React.SetStateAction<PlaybackSettings>>;
}

export const SpeedSettingsPanel: React.FC<SpeedSettingsPanelProps> = ({
  settings,
  setSettings,
}) => {
  const updateSetting = <K extends keyof PlaybackSettings>(key: K, value: PlaybackSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 text-xs text-zinc-300">
      {/* Animation Speed Multiplier */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Gauge className="w-4 h-4 text-indigo-400" />
            <span>动画播放速度 (Animation Speed)</span>
          </div>
          <span className="font-mono font-bold text-indigo-400 text-sm">
            {settings.speed}x
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.25}
            max={2.5}
            step={0.05}
            value={settings.speed}
            onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
            className="flex-1 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {[0.5, 0.75, 1.0, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => updateSetting('speed', rate)}
              className={`py-1 rounded-lg font-mono font-medium text-[11px] transition-all cursor-pointer ${
                settings.speed === rate
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Entry Cadence / Interval */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>弹幕进入节奏 (Entry Cadence Rhythm)</span>
          </div>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {settings.entryInterval}s
          </span>
        </div>

        <input
          type="range"
          min={0.2}
          max={4.0}
          step={0.1}
          value={settings.entryInterval}
          onChange={(e) => updateSetting('entryInterval', parseFloat(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>0.2s (狂暴刷屏)</span>
          <span>1.2s (经典直播)</span>
          <span>4.0s (舒缓日常)</span>
        </div>
      </div>

      {/* Bubble Size & Font Scale (气泡体型与字号大小) */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Maximize2 className="w-4 h-4 text-indigo-400" />
            <span>气泡体型与字号缩放 (Bubble Size Scale)</span>
          </div>
          <span className="font-mono font-bold text-indigo-300 text-sm bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
            {settings.bubbleScale}x
          </span>
        </div>

        <p className="text-[11px] text-zinc-300 leading-relaxed">
          画布保持 512×2400 原规格，气泡本体、头像与打赏文字全面放大，确保在视频剪辑中醒目清晰！
        </p>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1.0}
            max={1.85}
            step={0.05}
            value={settings.bubbleScale}
            onChange={(e) => updateSetting('bubbleScale', parseFloat(e.target.value))}
            className="flex-1 accent-indigo-400 cursor-pointer"
          />
        </div>

        {/* Quick Size Presets */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {[
            { label: '标准 1.0x', val: 1.0 },
            { label: '中大 1.2x', val: 1.2 },
            { label: '推荐 1.35x', val: 1.35 },
            { label: '巨幕 1.6x', val: 1.6 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => updateSetting('bubbleScale', preset.val)}
              className={`py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                settings.bubbleScale === preset.val
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strict 512px Constraint & Bubble Width */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>512px 窗口边界保护</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
            {settings.bubbleMaxWidth}px / Max 512px
          </span>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          根据要求，窗口宽度固定为 512px。气泡最大宽度已被严格限制，绝不超出 512px 边界。
        </p>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={360}
            max={512}
            step={4}
            value={settings.bubbleMaxWidth}
            onChange={(e) => updateSetting('bubbleMaxWidth', parseInt(e.target.value, 10))}
            className="flex-1 accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Layout & Stage View Controls */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>舞台布局与堆叠 (Stage Layout)</span>
        </div>

        {/* Scroll direction */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">弹幕滚动流向:</span>
          <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/40">
            <button
              type="button"
              onClick={() => updateSetting('scrollDirection', 'bottom-to-top')}
              className={`px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                settings.scrollDirection === 'bottom-to-top'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              自底向上 (YouTube流)
            </button>
            <button
              type="button"
              onClick={() => updateSetting('scrollDirection', 'top-to-bottom')}
              className={`px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                settings.scrollDirection === 'top-to-bottom'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              自顶向下 (常规流)
            </button>
          </div>
        </div>

        {/* Spacing */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">气泡纵向间距:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={2}
              max={24}
              step={2}
              value={settings.bubbleSpacing}
              onChange={(e) => updateSetting('bubbleSpacing', parseInt(e.target.value, 10))}
              className="w-24 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono text-zinc-300 w-8 text-right">
              {settings.bubbleSpacing}px
            </span>
          </div>
        </div>

        {/* Max visible */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">舞台保留最大气泡数:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={settings.maxVisibleBubbles}
              onChange={(e) => updateSetting('maxVisibleBubbles', parseInt(e.target.value, 10))}
              className="w-24 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono text-zinc-300 w-8 text-right">
              {settings.maxVisibleBubbles}条
            </span>
          </div>
        </div>

        {/* VFX Particle toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>启用金币/彩带动态粒子特效</span>
          </div>
          <button
            type="button"
            onClick={() => updateSetting('enableVfxParticles', !settings.enableVfxParticles)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.enableVfxParticles ? 'bg-indigo-600' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                settings.enableVfxParticles ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stage Preview Background Mode */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Eye className="w-4 h-4 text-sky-400" />
          <span>预览背景模式 (Stage Backdrop Mode)</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          仅影响实时预览查看效果，实际导出时可选择透明 Alpha 通道或绿幕抠像。
        </p>
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[
            { id: 'transparent', label: '透明棋盘' },
            { id: 'dark', label: '暗黑背景' },
            { id: 'green', label: '绿幕抠像' },
            { id: 'light', label: '明亮背景' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => updateSetting('bgMode', mode.id as PlaybackSettings['bgMode'])}
              className={`py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                settings.bgMode === mode.id
                  ? 'border-sky-400 bg-sky-500/20 text-white'
                  : 'border-white/5 bg-black/40 text-zinc-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
