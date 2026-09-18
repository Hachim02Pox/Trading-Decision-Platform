import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import timelineData from "./data/timeline.json";
import { theme } from "./theme";
import { Subtitles } from "./Subtitles";
import { SCENE_COMPONENTS } from "./scenes";
import { AmbientBackground } from "./scenes/shared";

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
  }>;
};

export const getSceneDurationFrames = (durationSeconds: number) => Math.round(durationSeconds * FPS);

export const getTotalDurationFrames = () =>
  timeline.scenes.reduce((acc, scene) => acc + getSceneDurationFrames(scene.durationSeconds), 0);

export const F5Video: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.bg }}>
      <AmbientBackground />
      {timeline.scenes.map((scene) => {
        const durationInFrames = getSceneDurationFrames(scene.durationSeconds);
        const from = cursor;
        cursor += durationInFrames;
        const SceneComponent = SCENE_COMPONENTS[scene.id];

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} name={scene.id}>
            <Audio src={staticFile(`audio/${scene.audioFile}`)} />
            {SceneComponent ? (
              <SceneComponent durationInFrames={durationInFrames} subtitles={scene.subtitles} />
            ) : null}
            <Subtitles subtitles={scene.subtitles} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
