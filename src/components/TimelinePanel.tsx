import React, { useState, useRef } from 'react';
import { ChatMessage, PlaybackSettings } from '../types/chat';
import { PRESET_SCRIPTS, calculateTotalRuntime, parseScriptText, parseJsonScript } from '../utils/timeline';
import { SUPERCHAT_TIERS } from '../utils/superchat';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Copy,
  FileCode,
  FileText,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface TimelinePanelProps {
  timeline: ChatMessage[];
  setTimeline: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isPlaying: boolean;
  activePlayIndex: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onClearStage: () => void;
  onTriggerSingle: (msg: ChatMessage) => void;
  settings: PlaybackSettings;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  timeline,
  setTimeline,
  isPlaying,
  activePlayIndex,
  onPlay,
  onPause,
  onReset,
  onClearStage,
  onTriggerSingle,
  settings,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'json' | 'text'>('json');
  const [rawJsonText, setRawJsonText] = useState(() => {
    return JSON.stringify(
      [
        {
          username: "星野喵喵",
          message: "主播晚上好！今天的开场太棒啦！✨",
          type: "member",
          badge: { type: "member", label: "👑 黄金会员" },
          entranceEffect: "slide-bottom",
          delayBeforeNext: 1.0
        },
        {
          username: "Cyber_Knight",
          message: "祝贺直播间达成 100,000 订阅！今晚不醉不归！🎉",
          type: "superchat",
          scTier: 3,
          amount: "$10.00",
          badge: { type: "moderator", label: "MOD" },
          entranceEffect: "superchat-flare",
          delayBeforeNext: 1.2
        },
        {
          username: "SuperDanmu_Master",
          message: "全场起立！这是今晚最高规格的赤字彩虹 SuperChat！继续冲！🔥🔥🔥",
          type: "superchat",
          scTier: 7,
          amount: "$500.00",
          entranceEffect: "confetti-burst",
          delayBeforeNext: 1.8
        }
      ],
      null,
      2
    );
  });
  const [rawScriptText, setRawScriptText] = useState(
`[Alice:SC3:$10] 祝贺突破十万粉！🎉
[Bob:MEMBER] 专属会员前来报到！
[Charlie:SC7:$500] 全场最高规格彩虹红SC！冲鸭！！！🔥
主播今天状态无敌！
[DanmuMaster:MOD] 大家注意弹幕礼仪哦~`
  );

  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalRuntime = calculateTotalRuntime(timeline, settings.speed, settings.entryInterval);

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_SCRIPTS.find((p) => p.id === presetId);
    if (preset) {
      setTimeline(preset.messages.map((m) => ({ ...m })));
    }
  };

  const handleDuplicate = (index: number) => {
    const item = timeline[index];
    const duplicated: ChatMessage = {
      ...item,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const next = [...timeline];
    next.splice(index + 1, 0, duplicated);
    setTimeline(next);
  };

  const handleDelete = (index: number) => {
    const next = timeline.filter((_, i) => i !== index);
    setTimeline(next);
  };

  const handleDelayChange = (index: number, newDelay: number) => {
    const next = [...timeline];
    next[index] = { ...next[index], delayBeforeNext: Math.max(0.1, newDelay) };
    setTimeline(next);
  };

  // Direct JSON file picker
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseJsonScript(content);
        setTimeline(parsed);
        setImportStatus({
          type: 'success',
          message: `成功从文件 "${file.name}" 导入 ${parsed.length} 条弹幕气泡！`,
        });
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: '导入失败: ' + (err as Error).message,
        });
      }
    };
    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: '读取本地 JSON 文件失败，请重试。',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    try {
      if (importTab === 'json') {
        const parsed = parseJsonScript(rawJsonText);
        setTimeline(parsed);
        setShowImportModal(false);
        setImportStatus({
          type: 'success',
          message: `成功导入 ${parsed.length} 条 JSON 气泡！`,
        });
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        const parsed = parseScriptText(rawScriptText);
        const newItems: ChatMessage[] = parsed.map((p, idx) => ({
          id: `imported-${Date.now()}-${idx}`,
          username: p.username || 'Viewer',
          avatarUrl:
            p.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
          badge: p.badge,
          type: p.type || 'normal',
          scTier: p.scTier,
          amount: p.amount,
          message: p.message || '',
          entranceEffect: p.entranceEffect || 'slide-right',
          entranceDuration: p.entranceDuration || 0.5,
          delayBeforeNext: p.delayBeforeNext || 1.2,
        }));
        setTimeline(newItems);
        setShowImportModal(false);
        setImportStatus({
          type: 'success',
          message: `成功导入 ${newItems.length} 条文本气泡！`,
        });
        setTimeout(() => setImportStatus(null), 3500);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(timeline, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamchat_script_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4 text-xs text-zinc-300">
      {/* Import Status Toast */}
      {importStatus && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 border transition-all ${
            importStatus.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{importStatus.message}</span>
        </div>
      )}

      {/* Playback Controls & Status */}
      <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">剧本总览</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[11px]">
              {timeline.length} 条气泡
            </span>
          </div>
          <div className="text-right font-mono text-zinc-400">
            预计时长: <span className="text-amber-400 font-bold">{totalRuntime}s</span>
          </div>
        </div>

        {/* Master Playback Buttons */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              type="button"
              onClick={onPlay}
              disabled={timeline.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>播放剧本 (Play)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>暂停 (Pause)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="重置播放进度"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClearStage}
            className="flex items-center justify-center p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
            title="清空舞台当前所有气泡"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Scripts Selection */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>官方精选预设剧本 (Preset Templates)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_SCRIPTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset.id)}
              className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-indigo-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-semibold text-zinc-100 group-hover:text-indigo-300 truncate">
                {preset.title}
              </div>
              <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Script Import/Export Toolbar - Fully equipped with JSON & Text */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">剧本文件管理 (Import & Export)</span>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>导出 JSON 文件</span>
          </button>
        </div>

        {/* Primary Import Actions: JSON File Upload & Modal Dialog */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-400/50 text-indigo-200 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-sm">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>本地导入 .JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleJsonFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white font-medium text-xs transition-all cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>粘贴 JSON / 文本</span>
          </button>
        </div>
      </div>

      {/* Timeline Items List */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {timeline.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
            时间轴暂无气泡，请点击上方「本地导入 .JSON」或选择预设剧本。
          </div>
        ) : (
          timeline.map((item, index) => {
            const isPlayingThis = isPlaying && activePlayIndex === index;
            const scColor = item.scTier ? SUPERCHAT_TIERS[item.scTier].headerBg : undefined;

            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  isPlayingThis
                    ? 'bg-indigo-950/70 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                    : 'bg-zinc-900/50 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-5 text-[11px] font-mono text-zinc-500 font-bold">
                    #{index + 1}
                  </span>

                  <img
                    src={item.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white truncate max-w-[120px]">
                        {item.username}
                      </span>
                      {item.type === 'superchat' && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: scColor }}
                        >
                          {item.amount || 'SC'}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.entranceEffect}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {item.message || '(空内容)'}
                    </div>
                  </div>
                </div>

                {/* Delay before next input & Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-1 bg-black/40 px-1.5 py-1 rounded border border-white/5">
                    <span className="text-[10px] text-zinc-500">延时:</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={10}
                      value={item.delayBeforeNext ?? 1.2}
                      onChange={(e) => handleDelayChange(index, parseFloat(e.target.value) || 1)}
                      className="w-10 bg-transparent text-right font-mono text-xs text-white focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">s</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTriggerSingle(item)}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-indigo-300"
                    title="立即试弹该气泡"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(index)}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                    title="复制气泡"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="p-1.5 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comprehensive Import Modal: JSON & Text */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/20 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white text-base">剧本批量导入中心 (Import Studio)</span>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Subtabs: JSON vs Text */}
            <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setImportTab('json')}
                className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${
                  importTab === 'json'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                JSON 格式导入 (推荐)
              </button>
              <button
                type="button"
                onClick={() => setImportTab('text')}
                className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${
                  importTab === 'text'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                纯文本语法导入
              </button>
            </div>

            {importTab === 'json' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>支持 JSON 数组或包含 messages 数组的对象：</span>
                  <label className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>选择本地 .json 文件</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setRawJsonText(evt.target?.result as string);
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={9}
                  value={rawJsonText}
                  onChange={(e) => setRawJsonText(e.target.value)}
                  placeholder="在此直接粘贴您的 JSON 数组或对象代码..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-400"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400 leading-normal">
                  每行一条气泡。支持语法如：<br />
                  <code>[用户名] 普通文字</code><br />
                  <code>[用户名:SC5:$50] 打赏文字</code><br />
                  <code>[用户名:MEMBER] 会员文字</code>
                </p>
                <textarea
                  rows={9}
                  value={rawScriptText}
                  onChange={(e) => setRawScriptText(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 cursor-pointer"
              >
                解析并导入到剧本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
