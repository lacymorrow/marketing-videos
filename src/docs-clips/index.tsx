import React from "react";
import { Composition, Still } from "remotion";
import { DocClip, docClipMetadata } from "./DocClip";
import { DocFilm, docFilmMetadata } from "./DocFilm";
import { FixtureScreen } from "./FixtureScreen";
import { DocClipData, DocClipProps, DocFilmProps, FPS, HEIGHT, WIDTH } from "./types";
import sample from "../../docs-clips/fixtures/sample/events.json";

const defaultProps: DocClipProps = { data: sample as unknown as DocClipData, videoSrc: "raw.mp4" };
const filmProps: DocFilmProps = { ...defaultProps };

export const DocClipsRoot: React.FC = () => (
  <>
    <Composition id="DocClip" component={DocClip} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={240} defaultProps={defaultProps} calculateMetadata={docClipMetadata} />
    <Composition id="DocFilm" component={DocFilm} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={330} defaultProps={filmProps} calculateMetadata={docFilmMetadata} />
    <Still id="DocFixtureScreen" component={FixtureScreen} width={1536} height={960} />
  </>
);
