import wave
import struct
import math

sample_rate = 44100
duration = 4.0 # 4 seconds loop
bpm = 120
beats_per_sec = bpm / 60.0
# We'll make a 4-beat loop.

# Frequencies for a C major arpeggio
notes = [
    523.25, # C5
    659.25, # E5
    783.99, # G5
    1046.50 # C6
]

num_samples = int(sample_rate * duration)

with wave.open('bgm.wav', 'w') as f:
    f.setnchannels(1) # mono
    f.setsampwidth(2) # 16 bit
    f.setframerate(sample_rate)
    
    for i in range(num_samples):
        # Determine which note we're on
        t = i / float(sample_rate)
        beat_idx = int(t * beats_per_sec * 2) % len(notes)
        freq = notes[beat_idx]
        
        # Envelope: Decay
        t_in_beat = (t * beats_per_sec * 2) % 1.0
        env = max(0, 1.0 - t_in_beat * 1.5)
        
        # Generate sine wave + triangle for a cheerful sound
        val_sine = math.sin(2.0 * math.pi * freq * t)
        val_tri = 2 * abs(2 * (t * freq - math.floor(t * freq + 0.5))) - 1
        
        val = (val_sine * 0.7 + val_tri * 0.3) * env * 0.3
        
        # 16-bit PCM
        val = max(-1.0, min(1.0, val))
        val_int = int(val * 32767.0)
        f.writeframes(struct.pack('<h', val_int))

print("bgm.wav generated.")
