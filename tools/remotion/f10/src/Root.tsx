import React from "react";
import { Composition } from "remotion";
import { F10Video, FPS, getTotalDurationFrames } from "./F10Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F10Video"
        component={F10Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
