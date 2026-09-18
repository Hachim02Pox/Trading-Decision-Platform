import React from "react";
import { Composition } from "remotion";
import { F2Video, FPS, getTotalDurationFrames } from "./F2Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F2Video"
        component={F2Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
