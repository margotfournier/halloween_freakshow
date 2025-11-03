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

### Générer un fichier audio avec message caché

```bash
python fun.py
```

Ce script va :
- Créer une image avec votre texte
- Convertir l'image en signal audio
- Générer un fichier `message_cache.wav`
- Afficher un aperçu du spectrogramme

### Lire le spectrogramme d'un fichier audio

```bash
python read_spectrogram.py
```

Ce script va afficher le spectrogramme du fichier `message_cache.wav` pour visualiser le message caché.

## Personnalisation

Pour modifier le message, éditez la variable `text` dans [fun.py](fun.py):

```python
text = "votre message ici"
```

## Désactivation de l'environnement virtuel

```bash
deactivate
```
