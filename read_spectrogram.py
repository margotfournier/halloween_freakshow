import numpy as np
import matplotlib.pyplot as plt
from scipy.io import wavfile

# Lire le fichier audio
sample_rate, signal = wavfile.read("message_cache.wav")

# Afficher le spectrogramme
plt.figure(figsize=(12, 6))
plt.specgram(signal, Fs=sample_rate, NFFT=1024, noverlap=512, cmap="inferno")
plt.title("Spectrogramme - Message caché")
plt.xlabel("Temps (s)")
plt.ylabel("Fréquence (Hz)")
plt.colorbar(label="Intensité (dB)")
plt.tight_layout()
plt.show()
