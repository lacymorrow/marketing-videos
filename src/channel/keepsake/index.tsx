import React from "react";
import { Composition, Folder } from "remotion";
import { sec, video } from "../theme";
import { Label, LogCard, NumberCard } from "./Cards";
import { CaseEvolution, CaseScale } from "./CaseEvolution";
import { Gate } from "./Gate";
import { Trip, tripDefaults } from "./Trip";
import { Wrap } from "./Wrap";

// Graphics for ~/repo/keepsake/media/video-keepsake-recorder/storyboard.md.
// IDs match that file's graphics table. Render with ./render-keepsake.sh.
// The jellyfish outer case only: the 38 mm wide exports, in export order.
const jellyfish = [{ file: "wearable-01.stl", date: "2026-09-06" }, { file: "wearable-02.stl", date: "2026-09-07" }, { file: "wearable-03.stl", date: "2026-09-07" }, { file: "wearable-04.stl", date: "2026-09-07" }, { file: "wearable-05.stl", date: "2026-09-07" }, { file: "wearable-06.stl", date: "2026-09-08" }, { file: "wearable-09.stl", date: "2026-09-08" }, { file: "wearable-10.stl", date: "2026-09-08" }, { file: "wearable-11.stl", date: "2026-09-08" }, { file: "wearable-12.stl", date: "2026-09-08" }, { file: "wearable-13.stl", date: "2026-09-08" }, { file: "wearable-14.stl", date: "2026-09-08" }, { file: "wearable-15.stl", date: "2026-09-08" }, { file: "wearable-16.stl", date: "2026-09-08" }];

const size = { width: video.width, height: video.height, fps: video.fps };

export const KeepsakeGraphics: React.FC = () => (
  <Folder name="Keepsake">
    <Composition id="g1-trip" component={Trip} durationInFrames={sec(45)} defaultProps={tripDefaults} {...size} />
    <Composition id="g2-gate" component={Gate} durationInFrames={sec(15)} {...size} />
    <Composition id="g3-wrap" component={Wrap} durationInFrames={sec(12)} {...size} />
    <Composition id="g4-capped" component={LogCard} durationInFrames={sec(5)} defaultProps={{ lines: ["gate 41% floor 48 open 90[[(capped)]] maxE 725"], label: "From the log" }} {...size} />
    <Composition
      id="g5-96-boots"
      component={NumberCard}
      durationInFrames={sec(6)}
      defaultProps={{ rows: [{ n: "96", what: "boots" }, { n: "24", what: "files on the card" }, { n: "0", what: "failures" }], label: "Not filmed", source: "FINDINGS.md, 2026-09-10" }}
      {...size}
    />
    <Composition id="g6-converter" component={LogCard} durationInFrames={sec(6)} defaultProps={{ lines: ["[adpcm_ima_wav] ERROR: step_index[0] = 217", "Conversion failed!"], label: "From the log" }} {...size} />
    <Composition id="g7-staged" component={Label} durationInFrames={sec(3)} defaultProps={{ text: "Staged audio. My voice only." }} {...size} />
    <Composition id="g8-not-filmed" component={Label} durationInFrames={sec(4)} defaultProps={{ text: "Not filmed" }} {...size} />
    <Composition id="g9-recreated" component={Label} durationInFrames={sec(4)} defaultProps={{ text: "Recreated" }} {...size} />
    <Composition id="g10-case-evolution" component={CaseEvolution} durationInFrames={sec(jellyfish.length * 1.2)} defaultProps={{ steps: jellyfish, perStep: 1.2 }} {...size} />
    <Composition id="g11-case-scale" component={CaseScale} durationInFrames={sec(8)} defaultProps={{ one: "wearable-16.stl", two: "wearable-22.stl" }} {...size} />
  </Folder>
);
