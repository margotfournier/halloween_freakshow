hygbn # 🎪 Analyseur Spectral Vintage - Le Grand Cirque

Application web d'analyse spectrale avec esthétique cirque vintage (années 1920-50), conçue pour révéler des indices cachés dans des enregistrements audio via spectrogramme.

## 📁 Structure du projet

```
front/
├── spectral_analyzer.html    # Interface principale
├── spectral_analyzer.css     # Styles vintage cirque
├── spectral_analyzer.js      # Logique d'analyse audio
└── README.md                 # Ce fichier
```

## ✨ Fonctionnalités

- 🎙️ **Enregistrement audio** via microphone avec visualisation en temps réel
- 📁 **Upload de fichiers** audio (WAV, MP3, WebM, etc.)
- 📊 **Analyse FFT** avec algorithme Cooley-Tukey
- 🎨 **Spectrogramme vintage** avec palette sépia/bordeaux/doré
- 🎪 **Interface Art Déco** inspirée des affiches de cirque
- 📱 **Responsive** adapté tablettes

## 🚀 Lancer l'application en local

### Option 1 : Python (le plus simple)

Si vous avez Python installé :

```bash
# Python 3
cd front
python3 -m http.server 8000
```

Puis ouvrez votre navigateur à : **http://localhost:8000**

### Option 2 : Node.js avec npx

Si vous avez Node.js installé :

```bash
cd front
npx http-server -p 8000
```

Puis ouvrez : **http://localhost:8000**

### Option 3 : PHP

Si vous avez PHP installé :

```bash
cd front
php -S localhost:8000
```

Puis ouvrez : **http://localhost:8000**

### Option 4 : Extension VSCode (si vous utilisez VSCode)

1. Installez l'extension **"Live Server"** par Ritwick Dey
2. Clic droit sur `spectral_analyzer.html`
3. Sélectionnez **"Open with Live Server"**

### Option 5 : Double-clic (limité)

⚠️ **Limitations** : Le double-clic sur le fichier HTML peut fonctionner, mais certaines fonctionnalités (notamment l'enregistrement audio) peuvent être restreintes par les politiques de sécurité des navigateurs en mode `file://`.

**Recommandation** : Utilisez toujours un serveur local (Options 1-4) pour une expérience complète.

## 🎯 Utilisation

### 1. Enregistrer un audio

1. Cliquez sur **"Enregistrer"**
2. Autorisez l'accès au microphone si demandé
3. Parlez ou jouez votre audio
4. Cliquez sur **"Arrêter"** quand vous avez terminé
5. Cliquez sur **"Analyser le Spectre"**

### 2. Charger un fichier audio

1. Cliquez sur **"Charger un fichier audio"**
2. Sélectionnez votre fichier audio (.wav, .mp3, etc.)
3. Cliquez sur **"Analyser le Spectre"**

### 3. Visualiser le spectrogramme

Le spectrogramme s'affiche dans la **Fenêtre d'Observation Spectrale** avec :
- **Axe X** : Temps (secondes)
- **Axe Y** : Fréquence (Hz)
- **Couleurs** : Intensité du signal (sépia → doré pour faible → forte)

## 🎨 Thème visuel

- **Palette** : Sépia (#5c4033), Bordeaux (#6b1923), Doré (#d4af37), Noir (#0f0a08)
- **Typographie** : Georgia, style affiche de cirque
- **Effets** : Grain, patine, ornements Art Déco
- **Animations** : Jauges mécaniques, apparition progressive

## 🔧 Technologies utilisées

- **Web Audio API** : Capture et analyse audio
- **Canvas API** : Rendu du spectrogramme
- **FFT** : Transformation de Fourier rapide (Cooley-Tukey)
- **Vanilla JavaScript** : Pas de dépendances externes

## 🎪 Contexte escape game

Cet outil révèle des messages cachés encodés dans des fichiers audio via leur représentation spectrale. Parfait pour créer des énigmes où les joueurs doivent :
- Enregistrer des sons dans l'environnement
- Analyser des fichiers audio trouvés
- Découvrir des messages visuels cachés dans le spectrogramme

## 📝 Notes techniques

### Paramètres d'analyse

- **FFT Size** : 2048 points
- **Hop Size** : 512 échantillons (25% overlap)
- **Plage de fréquences** : 0-8000 Hz
- **Fenêtrage** : Hamming window
- **Résolution** : ~21 Hz par bin

### Compatibilité navigateurs

Testé sur :
- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ⚠️ Nécessite un navigateur moderne avec support Web Audio API

### Permissions requises

L'application demande l'accès au microphone uniquement si vous utilisez la fonction d'enregistrement. Vous pouvez refuser et utiliser uniquement l'upload de fichiers.

## 🐛 Dépannage

**Le microphone ne fonctionne pas**
- Vérifiez les permissions du navigateur
- Assurez-vous d'utiliser HTTPS ou localhost
- Rechargez la page et réessayez

**Le spectrogramme ne s'affiche pas**
- Vérifiez que le fichier audio est valide
- Essayez un fichier plus court (< 30 secondes)
- Ouvrez la console développeur (F12) pour voir les erreurs

**L'interface n'est pas belle**
- Vérifiez que les fichiers CSS et JS sont bien chargés
- Utilisez un serveur local plutôt que file://
- Essayez un autre navigateur

## 📄 Licence

Projet personnel - Libre d'utilisation

---

**Breveté · Société des Machines Acoustiques · Paris MCMXXV** 🎩
