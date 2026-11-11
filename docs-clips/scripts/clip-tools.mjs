#!/usr/bin/env node
// Helpers for docs-clips/render.sh.
//   clip-tools.mjs props  <clip-dir> <stage-dir>   write props.json, stage media for --public-dir
//   clip-tools.mjs vtt    <clip-dir>               print WebVTT from caption events
//   clip-tools.mjs poster <clip-dir> [--film]      print the poster timestamp (seconds)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [cmd, dir, arg] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(path.join(dir, "events.json"), "utf8"));
const start = data.trim?.start ?? 0;
const end = data.trim?.end ?? data.duration;
const OPENER = 1.5;

const stamp = (s) => {
  const ms = Math.round(Math.max(0, s) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};

if (cmd === "props") {
  fs.mkdirSync(arg, { recursive: true });
  const stage = (name) => {
    const dst = path.join(arg, path.basename(name));
    fs.rmSync(dst, { force: true });
    fs.copyFileSync(path.resolve(dir, name), dst);
    return path.basename(name);
  };
  const props = { data, videoSrc: stage(data.video) };
  if (fs.existsSync(path.join(dir, "voice.m4a"))) props.voiceSrc = stage("voice.m4a");
  else if (fs.existsSync(path.join(dir, "voice.aiff"))) {
    // Remotion's audio probe rejects AIFF-C from `say`; transcode once to AAC.
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(dir, "voice.aiff"), "-c:a", "aac", "-b:a", "96k", path.join(arg, "voice.m4a")]);
    props.voiceSrc = "voice.m4a";
  }
  const out = path.join(arg, "props.json");
  fs.writeFileSync(out, JSON.stringify(props, null, 2));
  console.log(out);
} else if (cmd === "vtt") {
  // Cue times are relative to the film: opener offset + time inside the trimmed body.
  const cues = data.events.filter((e) => e.type === "caption").sort((a, b) => a.t - b.t);
  let out = "WEBVTT\n\n";
  cues.forEach((c, i) => {
    const s = OPENER + c.t - start;
    out += `${i + 1}\n${stamp(s)} --> ${stamp(s + c.duration)}\n${c.text}\n\n`;
  });
  process.stdout.write(out);
} else if (cmd === "poster") {
  // Mid-zoom on the first focus, else the middle of the clip.
  const f = data.events.find((e) => e.type === "focus");
  const local = f ? f.t + 0.6 - start : (end - start) / 2;
  console.log((local + (arg === "--film" ? OPENER : 0)).toFixed(2));
} else {
  console.error("usage: clip-tools.mjs props|vtt|poster <clip-dir> [arg]");
  process.exit(2);
}
