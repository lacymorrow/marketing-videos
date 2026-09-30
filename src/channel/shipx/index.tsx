import React from "react";
import { Composition, Folder } from "remotion";
import { sec, video } from "../theme";
import { ShipxCard } from "./Card";

// Promo graphics for ~/repo/shipx/media/demo-script.md.
export const ShipxGraphics: React.FC = () => (
  <Folder name="Shipx">
    <Composition id="shipx-card" component={ShipxCard} durationInFrames={sec(10)} width={video.width} height={video.height} fps={video.fps} />
  </Folder>
);
