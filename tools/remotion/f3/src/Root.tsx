import React from "react";
import { Composition } from "remotion";
import { F3Video, FPS, getTotalDurationFrames } from "./F3Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F3Video"
        component={F3Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
