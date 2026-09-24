import React from "react";
import { Composition } from "remotion";
import { F8Video, FPS, getTotalDurationFrames } from "./F8Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F8Video"
        component={F8Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
