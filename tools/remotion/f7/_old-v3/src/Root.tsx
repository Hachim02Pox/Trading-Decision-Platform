import React from "react";
import { Composition } from "remotion";
import { F7Video, FPS, getTotalDurationFrames } from "./F7Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F7Video"
        component={F7Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
