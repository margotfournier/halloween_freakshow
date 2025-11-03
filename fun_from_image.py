import numpy as np
from scipy.io.wavfile import write
from PIL import Image
import matplotlib.pyplot as plt
import sys

# ==============================
# PARAMÈTRES
# ==============================
if len(sys.argv) < 2:
    print("Usage: python fun_from_image.py <chemin_image>")
    print("Exemple: python fun_from_image.py mon_image.png")
    sys.exit(1)

image_path = sys.argv[1]
duration = 6.0          # secondes
sample_rate = 44100
min_freq, max_freq = 300, 8000

# ==============================
# 1️⃣ Charger et préparer l'image
# ==============================
try:
    img = Image.open(image_path).convert('L')  # convertir en niveaux de gris
    print(f"✅ Image chargée: {img.size[0]}x{img.size[1]} pixels")
except Exception as e:
    print(f"❌ Erreur lors du chargement de l'image: {e}")
    sys.exit(1)

# Redimensionner si nécessaire pour avoir une largeur proportionnelle à la durée
img_width = int(duration * 200)
img_height = 400
img = img.resize((img_width, img_height), Image.Resampling.LANCZOS)

# Afficher l'image avant conversion
plt.figure(figsize=(12, 4))
plt.imshow(img, cmap='gray', aspect='auto')
plt.title("Image chargée (avant inversion)")
plt.axis('off')
plt.tight_layout()
plt.show()

# Inverser verticalement pour spectrogramme
img = img.transpose(Image.FLIP_TOP_BOTTOM)
img_array = np.array(img)/255.0

# ==============================
# 2️⃣ Convertir l'image en signal audio
# ==============================
t = np.linspace(0, duration, int(sample_rate*duration))
frequencies = np.linspace(min_freq, max_freq, img_height)
signal = np.zeros_like(t)

for y, row in enumerate(img_array):
    freq = frequencies[y]
    tone = np.sin(2*np.pi*freq*t)
    envelope = np.interp(np.linspace(0, img_width, len(t)), np.arange(img_width), row)
    signal += tone * envelope

signal /= np.max(np.abs(signal))

# ==============================
# 3️⃣ Sauvegarder le .wav
# ==============================
output_name = "message_cache_custom.wav"
write(output_name, sample_rate, (signal*32767).astype(np.int16))
print(f"✅ Fichier généré : {output_name}")

# ==============================
# 4️⃣ Visualisation et sauvegarde du spectrogramme
# ==============================
import warnings
warnings.filterwarnings('ignore', category=RuntimeWarning)

plt.figure(figsize=(10,6))
plt.specgram(signal, Fs=sample_rate, NFFT=1024, noverlap=512, cmap="inferno")
plt.title("Spectrogramme de votre image")
plt.xlabel("Temps (s)")
plt.ylabel("Fréquence (Hz)")
plt.tight_layout()

# Sauvegarder le spectrogramme
spectrogram_filename = "spectrogramme_custom.png"
plt.savefig(spectrogram_filename, dpi=300, bbox_inches='tight')
print(f"✅ Spectrogramme enregistré : {spectrogram_filename}")

plt.show()
