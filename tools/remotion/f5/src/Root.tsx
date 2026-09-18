import React from "react";
import { Composition } from "remotion";
import { F5Video, FPS, getTotalDurationFrames } from "./F5Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F5Video"
        component={F5Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
