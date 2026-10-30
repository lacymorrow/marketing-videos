import sys, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1]+"/kokoro-v1.0.onnx", sys.argv[1]+"/voices-v1.0.bin")
voice, out, text = sys.argv[2], sys.argv[3], sys.argv[4]
samples, sr = k.create(text, voice=voice, speed=1.0, lang="en-us")
sf.write(out, samples, sr); print(out, round(len(samples)/sr,2), "s")
