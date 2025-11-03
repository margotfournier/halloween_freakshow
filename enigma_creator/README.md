# Générateur de Message Audio Caché 🎵

Ce projet permet de cacher un message texte dans un fichier audio en utilisant un spectrogramme.

## Installation

### Avec uv (recommandé)

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```
## Utilisation

### Option 1 : Générer à partir de texte

```bash
python fun.py
```

Ce script va :
- Créer une image avec votre texte
- Afficher l'image générée
- Convertir l'image en signal audio
- Générer un fichier `message_cache_lisible.wav`
- Afficher le spectrogramme

Pour modifier le message, éditez la variable `text` dans [fun.py](fun.py):

```python
text = "votre message ici"
```

### Option 2 : Utiliser votre propre image

```bash
python fun_from_image.py mon_image.png
```

Ce script va :
- Charger votre image (PNG, JPG, etc.)
- La convertir en niveaux de gris automatiquement
- Afficher l'image avant conversion
- Générer un fichier `message_cache_custom.wav`
- Afficher le spectrogramme

**Conseil** : Utilisez des images avec un fond noir et du texte/motifs blancs pour un meilleur résultat.

### Lire le spectrogramme d'un fichier audio

```bash
python read_spectrogram.py
```

Ce script affiche le spectrogramme d'un fichier audio pour visualiser le message caché.

## Désactivation de l'environnement virtuel

```bash
deactivate
```
