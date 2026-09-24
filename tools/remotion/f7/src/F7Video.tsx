import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import timelineData from "./data/timeline.json";
import { Subtitles } from "./Subtitles";
import { SCENE_COMPONENTS } from "./scenes";
import { AmbientBackground, PostStack } from "./scenes/shared";
import type { WordT } from "./scenes/shared";

export const FPS = 30;

export const timeline = timelineData as {
  voice: string;
  rate: string;
  totalDurationSeconds: number;
  scenes: Array<{
    index: number;
    id: string;
    audioFile: string;
    durationSeconds: number;
    subtitles: Array<{ text: string; start: number; end: number }>;
    words: WordT[];
  }>;
};

const OUTRO_HOLD_FRAMES = 3 * FPS;

export const getSceneDurationFrames = (durationSeconds: number, isLast = false) =>
  Math.round(durationSeconds * FPS) + (isLast ? OUTRO_HOLD_FRAMES : 0);

export const getTotalDurationFrames = () =>
  timeline.scenes.reduce(
    (acc, scene, i) => acc + getSceneDurationFrames(scene.durationSeconds, i === timeline.scenes.length - 1),
    0,
  );

export const F7Video: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill>
      <AmbientBackground />
      <Audio src={staticFile("sfx/pad.wav")} volume={0.06} loop />
      {timeline.scenes.map((scene, i) => {
        const durationInFrames = getSceneDurationFrames(scene.durationSeconds, i === timeline.scenes.length - 1);
        const from = cursor;
        cursor += durationInFrames;
        const SceneComponent = SCENE_COMPONENTS[scene.id];

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} name={scene.id}>
            <Audio src={staticFile(`audio/${scene.audioFile}`)} />
            {SceneComponent ? (
              <SceneComponent durationInFrames={durationInFrames} subtitles={scene.subtitles} words={scene.words} />
            ) : null}
            <Subtitles subtitles={scene.subtitles} />
          </Sequence>
        );
      })}
      <PostStack />
    </AbsoluteFill>
  );
};
