import numpy as np
from scipy.io.wavfile import write
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt

# ==============================
# PARAMÈTRES
# ==============================
text = "COUCOU STOP C'EST LA CIA STOP"
duration = 6.0          # secondes
sample_rate = 44100
min_freq, max_freq = 300, 8000
img_height = 400        # augmenter la hauteur pour texte plus lisible
img_width = int(duration * 200)

# ==============================
# 1️⃣ Créer l'image du texte
# ==============================
img = Image.new("L", (img_width, img_height), color=0)
draw = ImageDraw.Draw(img)

# Utiliser la police par défaut de Pillow
font = None  # None utilise la police bitmap par défaut

text_bbox = draw.textbbox((0,0), text, font=font)
text_w, text_h = text_bbox[2]-text_bbox[0], text_bbox[3]-text_bbox[1]

# Répéter le texte sur plusieurs lignes pour qu'il occupe verticalement
lines = 4
for i in range(lines):
    draw.text(
        ((img_width - text_w)//2, (img_height - text_h)//2 + i*(text_h+5)//lines),
        text,
        fill=255,
        font=font
    )

# Afficher l'image avant conversion
plt.figure(figsize=(12, 4))
plt.imshow(img, cmap='gray', aspect='auto')
plt.title("Image du texte (avant inversion)")
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
write("message_cache_lisible.wav", sample_rate, (signal*32767).astype(np.int16))
print("✅ Fichier généré : message_cache_lisible.wav")

# ==============================
# 4️⃣ Visualisation rapide
# ==============================
plt.figure(figsize=(10,6))
plt.specgram(signal, Fs=sample_rate, NFFT=1024, noverlap=512, cmap="inferno")
plt.title("Spectrogramme (texte lisible)")
plt.xlabel("Temps (s)")
plt.ylabel("Fréquence (Hz)")
plt.show()
