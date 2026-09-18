import React from "react";
import { Composition } from "remotion";
import { F4Video, FPS, getTotalDurationFrames } from "./F4Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F4Video"
        component={F4Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
