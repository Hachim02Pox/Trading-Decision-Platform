import React from "react";
import { Composition } from "remotion";
import { F11Video, FPS, getTotalDurationFrames } from "./F11Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F11Video"
        component={F11Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
