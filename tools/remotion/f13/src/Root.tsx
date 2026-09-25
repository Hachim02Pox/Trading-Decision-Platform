import React from "react";
import { Composition } from "remotion";
import { F13Video, FPS, getTotalDurationFrames } from "./F13Video";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="F13Video"
        component={F13Video}
        durationInFrames={getTotalDurationFrames()}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
