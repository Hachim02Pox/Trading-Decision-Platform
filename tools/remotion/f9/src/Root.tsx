import React from "react";
import { Composition } from "remotion";
import { F9Video, FPS, getTotalDurationFrames } from "./F9Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F9Video"
        component={F9Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
