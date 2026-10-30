import sys, soundfile as sf, sounddevice as sd
data, sr = sf.read(sys.argv[1], dtype="float32")
dev = sys.argv[2] if len(sys.argv) > 2 else None
sd.play(data, sr, device=dev); sd.wait()
