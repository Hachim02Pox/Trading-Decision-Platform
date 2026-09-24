import React from "react";
import { Composition } from "remotion";
import { F6Video, FPS, getTotalDurationFrames } from "./F6Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F6Video"
        component={F6Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
