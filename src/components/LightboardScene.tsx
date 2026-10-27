import React from 'react';
import { FanCinemaLightboard, FanCinemaLightboardProps } from './FanCinemaLightboard';
import type { LightboardState } from './Stage512x2400';

interface Props extends Pick<FanCinemaLightboardProps, 'onChangeGreetingColumns' | 'onTriggerShuffle' | 'onToggleLoop' | 'onChangeCharInterval' | 'onChangeSplitLatinWords'> {
  state: LightboardState;
  scale: number;
  renderTime?: number;
}

/** The artwork layout is shared verbatim by the editor and frame exporter. */
export function LightboardScene({ state, scale, renderTime, onChangeGreetingColumns, onTriggerShuffle, onToggleLoop, onChangeCharInterval, onChangeSplitLatinWords }: Props) {
  return (
    <div
      className={`absolute inset-0 px-2 flex flex-col z-10 box-border pointer-events-auto ${
        state.layout === 'vertical-tower'
          ? 'justify-center items-center py-4'
          : state.layout === 'single-char-loop'
          ? 'justify-center items-center py-12'
          : 'justify-end pb-32 items-center'
      }`}
    >
      <FanCinemaLightboard
        greetingTitle={state.greetingTitle}
        greetingBody={state.greetingBody}
        senderName={state.senderName}
        theme={state.theme}
        layout={state.layout}
        titleSize={state.titleSize}
        bodySize={state.bodySize}
        nameSize={state.nameSize}
        charSize={state.charSize}
        greetingColumns={state.greetingColumns}
        onChangeGreetingColumns={onChangeGreetingColumns}
        isShuffling={state.isShuffling}
        onTriggerShuffle={onTriggerShuffle}
        isLooping={state.isLooping}
        onToggleLoop={onToggleLoop}
        charInterval={state.charInterval}
        onChangeCharInterval={onChangeCharInterval}
        splitLatinWords={state.splitLatinWords}
        onChangeSplitLatinWords={onChangeSplitLatinWords}
        renderTime={renderTime}
        scale={state.layout === 'vertical-tower' ? 1 : scale}
      />
    </div>
  );
}
