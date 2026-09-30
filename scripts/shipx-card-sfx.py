#!/usr/bin/env python3
"""Sound pass for the shipx-card composition, synthesized in code. Free, no samples.

Writes public/shipx/card-sfx.raw.wav; run ./scripts/shipx-card-sfx.sh to also
loudness-normalize it into public/shipx/card-sfx.wav. Frame numbers mirror `t`
in src/channel/shipx/Card.tsx (30 fps). If you retime the card, retime here.
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
FPS = 30
DUR = 10.0
rng = np.random.default_rng(7)  # fixed seed: same render every time
out = np.zeros(int(SR * DUR))

# Card.tsx timing
TYPE_IN, TYPE_GAP, ROWS = 6, 9, 9
PROMPT = 108  # sec(3.6)
TICK, TICK_GAP = 132, 6  # sec(4.4); each check lands 3 frames after its row's tick
OUT = 207  # sec(6.9)
END = 219  # sec(7.3)


def at(frame: float) -> int:
    return int(frame / FPS * SR)


def env(n: int, attack: float, tau: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1) if attack > 0 else 1
    return a * np.exp(-t / tau)


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def add(start: int, sig: np.ndarray, gain: float) -> None:
    end = min(len(out), start + len(sig))
    out[start:end] += gain * sig[: end - start]


def key(gain: float = 1.0) -> np.ndarray:
    """One soft keycap: filtered noise tick plus a short resonant body."""
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    noise = lowpass(rng.standard_normal(n), rng.uniform(2500, 4000)) * env(n, 0, 0.004)
    body = np.sin(2 * np.pi * rng.uniform(1600, 2400) * t) * env(n, 0, 0.005)
    return gain * rng.uniform(0.7, 1.0) * (0.8 * noise + 0.35 * body)


def enter() -> np.ndarray:
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    thunk = np.sin(2 * np.pi * 150 * t) * env(n, 0.001, 0.03)
    click = key()
    thunk[: len(click)] += 0.6 * click
    return thunk


def pluck(freq: float) -> np.ndarray:
    """Soft marimba-ish note for each finished step."""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 4 * freq * t) * env(n, 0, 0.03)
    return tone * env(n, 0.002, 0.16)


def bell(freq: float) -> np.ndarray:
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    partials = [(1, 1.0, 1.1), (2.0, 0.35, 0.6), (2.76, 0.2, 0.35), (5.4, 0.08, 0.15)]
    return sum(g * np.sin(2 * np.pi * freq * r * t) * env(n, 0.003, tau) for r, g, tau in partials)


def pad(freqs: list[float], length: float) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * f * t) + 0.15 * np.sin(2 * np.pi * 2 * f * t) for f in freqs) / len(freqs)
    rise = np.clip(t / 0.35, 0, 1) ** 2
    fall = np.clip((length - t) / 1.2, 0, 1)
    return tone * rise * fall


def swoosh(length: float) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    shape = np.sin(np.pi * t / length) ** 2
    return lowpass(rng.standard_normal(n), 900) * shape


# 1. Nine commands typing in: ~6 keys per row across its 8-frame type-on.
for row in range(ROWS):
    start = TYPE_IN + row * TYPE_GAP
    for k in range(6):
        add(at(start + k * 1.35) + int(rng.uniform(-0.006, 0.006) * SR), key(), 0.16)

# 2. `$ shipx`: five deliberate keys, then Enter as the first check lands.
for k in range(5):
    add(at(PROMPT + 4 + (k + 1) * 2.4), key(1.2), 0.3)
add(at(TICK), enter(), 0.35)

# 3. Each step finishes: rising A major pentatonic, quiet.
scale = [220.0, 246.9, 277.2, 329.6, 370.0, 440.0, 493.9, 554.4, 659.3]
for i, f in enumerate(scale):
    add(at(TICK + 3 + i * TICK_GAP), pluck(f * 2), 0.18)

# 4. The list clears, the end card lands on a bell over a low A chord.
add(at(OUT - 4), swoosh(0.45), 0.05)
add(at(END), bell(880.0), 0.16)
add(at(END), pad([110.0, 164.8, 220.0, 277.2], DUR - END / FPS), 0.14)

out /= max(1e-9, np.abs(out).max()) / 0.9
pcm = (out * 32767).astype(np.int16)
path = Path(__file__).resolve().parent.parent / "public/shipx/card-sfx.raw.wav"
with wave.open(str(path), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(path)
