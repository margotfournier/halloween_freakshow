// ================================================
// VINTAGE SPECTRAL ANALYZER - CIRCUS EDITION
// ================================================

class SpectralAnalyzer {
    constructor() {
        // Audio recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioBuffer = null;
        this.isRecording = false;

        // Web Audio API
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.gaugeAnimationId = null;

        // DOM elements - Vintage Dashboard
        this.mainToggle = document.getElementById('mainToggle');
        this.analyzeKnob = document.getElementById('analyzeKnob');
        this.statusLight = document.getElementById('statusLight');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.spectrogramCanvas = document.getElementById('spectrogramCanvas');
        this.machineStatus = document.getElementById('machineStatus');
        this.analyzeReady = document.getElementById('analyzeReady');

        // Canvas contexts
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.specCtx = this.spectrogramCanvas.getContext('2d');

        // Spectrogram data
        this.spectrogramData = [];

        // Active names
        this.activeNames = new Set();

        this.init();
    }

    init() {
        // Event listeners for vintage controls
        this.mainToggle.addEventListener('click', () => this.toggleRecording());
        this.analyzeKnob.addEventListener('click', () => this.handleAnalyze());

        // Initialize waveform canvas
        this.drawWaveformGrid();
        this.updateMachineStatus('Machine au repos');

        // Setup name buttons
        this.setupNameButtons();
    }

    setupNameButtons() {
        const nameButtons = document.querySelectorAll('.toggle-circular.small');
        nameButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                const name = button.getAttribute('data-name');

                if (button.classList.contains('active')) {
                    this.activeNames.add(name);
                } else {
                    this.activeNames.delete(name);
                }

                console.log('Noms actifs:', Array.from(this.activeNames));
            });
        });
    }

    drawWaveformGrid() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.lineWidth = 0.5;

        // Vertical grid lines
        const gridSpacing = 20;
        for (let x = 0; x < width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = 0; y < height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    updateWaveform() {
        if (!this.analyser || !this.isRecording) return;

        this.analyser.getByteTimeDomainData(this.dataArray);

        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width;
        const height = canvas.height;

        // Redraw grid
        this.drawWaveformGrid();

        // Draw waveform line
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / this.dataArray.length;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Continue animation loop
        if (this.isRecording) {
            requestAnimationFrame(() => this.updateWaveform());
        }
    }

    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
            this.mainToggle.classList.remove('inactive');
            this.mainToggle.classList.add('active');
        } else {
            this.stopRecording();
            this.mainToggle.classList.remove('active');
            this.mainToggle.classList.add('inactive');
        }
    }

    handleAnalyze() {
        if (this.audioBlob && !this.analyzeKnob.classList.contains('active')) {
            this.analyzeKnob.classList.add('active');
            this.analyzeAudio();
            setTimeout(() => {
                this.analyzeKnob.classList.remove('active');
            }, 1000);
        }
    }

    // ================================================
    // AUDIO RECORDING
    // ================================================

    async startRecording() {
        try {
            // Vérifier si l'API est disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('L\'API de capture audio n\'est pas disponible. Utilisez HTTPS ou localhost.');
            }

            console.log('Demande d\'accès au microphone...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            console.log('Microphone autorisé !');

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Vérifier les codecs supportés
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/ogg';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                }
            }
            console.log('Type MIME utilisé:', mimeType);

            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log('Données audio reçues:', event.data.size, 'bytes');
                }
            };

            this.mediaRecorder.onstop = () => {
                console.log('Enregistrement arrêté. Chunks:', this.audioChunks.length);
                this.audioBlob = new Blob(this.audioChunks, { type: mimeType });
                console.log('Taille du blob audio:', this.audioBlob.size, 'bytes');
                this.updateMachineStatus('Enregistrement terminé - Prêt à analyser');
                stream.getTracks().forEach(track => track.stop());

                // Activer la LED verte
                const ledGreen = this.analyzeReady.querySelector('.led-green');
                if (ledGreen) {
                    ledGreen.classList.add('active');
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                alert('Erreur pendant l\'enregistrement: ' + event.error.message);
            };

            this.mediaRecorder.start(100); // Collecter les données toutes les 100ms
            this.isRecording = true;
            console.log('Enregistrement démarré');

            // UI updates - Vintage dashboard
            this.statusLight.classList.add('active');
            this.updateMachineStatus('Enregistrement en cours...');

            // Start waveform visualization
            this.updateWaveform();

        } catch (error) {
            console.error('Erreur lors de l\'accès au microphone:', error);
            let errorMessage = 'Impossible d\'accéder au microphone.\n\n';

            if (error.name === 'NotAllowedError') {
                errorMessage += 'Permission refusée. Veuillez autoriser l\'accès au microphone.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'Aucun microphone détecté sur votre appareil.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Votre navigateur ne supporte pas cette fonctionnalité.';
            } else if (error.message.includes('HTTPS') || error.message.includes('localhost')) {
                errorMessage += 'Vous devez utiliser HTTPS ou localhost pour accéder au microphone.\n\n';
                errorMessage += 'Lancez un serveur local (voir README.md)';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
            this.updateMachineStatus('Erreur d\'accès au microphone');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            // UI updates - Vintage dashboard
            this.statusLight.classList.remove('active');

            // Reset waveform canvas
            this.drawWaveformGrid();
        }
    }

    // ================================================
    // GAUGE VISUALIZATION
    // ================================================

    drawGauge() {
        const canvas = this.gaugeCanvas;
        const ctx = this.gaugeCtx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 70;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw graduations
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 10; i++) {
            const angle = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
            const x1 = centerX + Math.cos(angle) * (radius - 10);
            const y1 = centerY + Math.sin(angle) * (radius - 10);
            const x2 = centerX + Math.cos(angle) * (radius - 20);
            const y2 = centerY + Math.sin(angle) * (radius - 20);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Draw needle
        const needleAngle = -Math.PI * 0.75 + (this.gaugeValue / 100) * Math.PI * 1.5;
        const needleLength = radius - 25;

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(needleAngle) * needleLength,
            centerY + Math.sin(needleAngle) * needleLength
        );
        ctx.stroke();

        // Draw center dot
        ctx.fillStyle = 'rgb(212, 175, 55)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    animateGauge() {
        if (!this.isRecording) return;

        this.analyser.getByteTimeDomainData(this.dataArray);

        // Calculate RMS (volume level)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const normalized = (this.dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / this.dataArray.length);
        this.gaugeValue = Math.min(100, rms * 300); // Scale to 0-100

        this.drawGauge();
        this.gaugeAnimationId = requestAnimationFrame(() => this.animateGauge());
    }

    // ================================================
    // AUDIO ANALYSIS & SPECTROGRAM
    // ================================================

    async analyzeAudio() {
        if (!this.audioBlob) {
            alert('Aucun audio à analyser');
            return;
        }

        this.updateMachineStatus('Analyse en cours...');

        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Convert blob to array buffer
            const arrayBuffer = await this.audioBlob.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Generate spectrogram
            await this.generateSpectrogram();

            this.updateMachineStatus('Analyse terminée - Spectre révélé');

        } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            alert('Erreur lors de l\'analyse audio: ' + error.message);
            this.updateMachineStatus('Erreur d\'analyse');
        }
    }

    async generateSpectrogram() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;

        // FFT parameters
        const fftSize = 2048;
        const hopSize = fftSize / 4;
        const numFrames = Math.floor((channelData.length - fftSize) / hopSize);

        // Frequency range
        const minFreq = 0;
        const maxFreq = 8000;
        const freqBinSize = sampleRate / fftSize;
        const minBin = Math.floor(minFreq / freqBinSize);
        const maxBin = Math.floor(maxFreq / freqBinSize);
        const numFreqBins = maxBin - minBin;

        // Prepare canvas
        const canvasWidth = Math.min(numFrames, 1200);
        const canvasHeight = 500;
        this.spectrogramCanvas.width = canvasWidth;
        this.spectrogramCanvas.height = canvasHeight;

        // Clear canvas with vintage background
        this.specCtx.fillStyle = '#0f0a08';
        this.specCtx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw grid
        this.drawGrid(canvasWidth, canvasHeight);

        // Storage for spectrogram data
        this.spectrogramData = [];

        // Process audio in chunks with animation
        const chunkSize = 50;
        for (let chunk = 0; chunk < Math.ceil(numFrames / chunkSize); chunk++) {
            const startFrame = chunk * chunkSize;
            const endFrame = Math.min((chunk + 1) * chunkSize, numFrames);

            for (let frame = startFrame; frame < endFrame; frame++) {
                const offset = frame * hopSize;
                const segment = channelData.slice(offset, offset + fftSize);

                // Apply Hamming window
                const windowed = this.applyHammingWindow(segment);

                // Perform FFT
                const spectrum = this.fft(windowed);

                // Extract magnitude in frequency range
                const magnitudes = [];
                for (let i = minBin; i < maxBin; i++) {
                    const real = spectrum.real[i];
                    const imag = spectrum.imag[i];
                    const magnitude = Math.sqrt(real * real + imag * imag);
                    const db = 20 * Math.log10(magnitude + 1e-10);
                    magnitudes.push(db);
                }

                this.spectrogramData.push(magnitudes);

                // Draw column
                const x = (frame / numFrames) * canvasWidth;
                this.drawSpectrogramColumn(x, magnitudes, canvasHeight);
            }

            // Allow UI updates between chunks
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Add final vintage overlay effect
        this.addVintageOverlay(canvasWidth, canvasHeight);
    }

    drawSpectrogramColumn(x, magnitudes, height) {
        const numBins = magnitudes.length;
        const barHeight = height / numBins;

        for (let i = 0; i < numBins; i++) {
            // Reverse Y axis (high freq at top)
            const y = height - (i + 1) * barHeight;

            // Normalize magnitude to 0-1 range
            const normalized = Math.max(0, Math.min(1, (magnitudes[i] + 60) / 60));

            // Vintage sepia color palette
            const color = this.getVintageColor(normalized);

            this.specCtx.fillStyle = color;
            this.specCtx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(1), Math.ceil(barHeight) + 1);
        }
    }

    getVintageColor(intensity) {
        // Create vintage sepia/gold color gradient
        if (intensity < 0.2) {
            // Very dark - almost black
            return `rgb(15, 10, 8)`;
        } else if (intensity < 0.4) {
            // Dark sepia
            const val = (intensity - 0.2) / 0.2;
            return `rgb(${42 * val}, ${24 * val}, ${16 * val})`;
        } else if (intensity < 0.6) {
            // Medium sepia
            const val = (intensity - 0.4) / 0.2;
            return `rgb(${92 + (107 - 92) * val}, ${64 + (49 - 64) * val}, ${51 + (35 - 51) * val})`;
        } else if (intensity < 0.8) {
            // Light brown to gold
            const val = (intensity - 0.6) / 0.2;
            return `rgb(${139 + (212 - 139) * val}, ${115 + (175 - 115) * val}, ${85 + (55 - 85) * val})`;
        } else {
            // Bright gold/cream
            const val = (intensity - 0.8) / 0.2;
            return `rgb(${212 + (245 - 212) * val}, ${175 + (230 - 175) * val}, ${55 + (211 - 55) * val})`;
        }
    }

    drawGrid(width, height) {
        this.specCtx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
        this.specCtx.lineWidth = 0.5;

        // Horizontal lines (frequency)
        const numHLines = 10;
        for (let i = 0; i <= numHLines; i++) {
            const y = (i / numHLines) * height;
            this.specCtx.beginPath();
            this.specCtx.moveTo(0, y);
            this.specCtx.lineTo(width, y);
            this.specCtx.stroke();
        }

        // Vertical lines (time)
        const numVLines = 20;
        for (let i = 0; i <= numVLines; i++) {
            const x = (i / numVLines) * width;
            this.specCtx.beginPath();
            this.specCtx.moveTo(x, 0);
            this.specCtx.lineTo(x, height);
            this.specCtx.stroke();
        }
    }

    addVintageOverlay(width, height) {
        // Add subtle vignette effect
        const gradient = this.specCtx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 1.5
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(15, 10, 8, 0.3)');

        this.specCtx.fillStyle = gradient;
        this.specCtx.fillRect(0, 0, width, height);
    }

    // ================================================
    // DSP FUNCTIONS
    // ================================================

    applyHammingWindow(signal) {
        const N = signal.length;
        const windowed = new Float32Array(N);

        for (let n = 0; n < N; n++) {
            const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1));
            windowed[n] = signal[n] * window;
        }

        return windowed;
    }

    fft(signal) {
        const N = signal.length;

        // Pad to power of 2 if necessary
        let paddedN = 1;
        while (paddedN < N) paddedN *= 2;

        const real = new Float32Array(paddedN);
        const imag = new Float32Array(paddedN);

        // Copy signal
        for (let i = 0; i < N; i++) {
            real[i] = signal[i];
        }

        // Cooley-Tukey FFT algorithm
        this.cooleyTukeyFFT(real, imag);

        return { real, imag };
    }

    cooleyTukeyFFT(real, imag) {
        const N = real.length;

        // Bit reversal
        let j = 0;
        for (let i = 0; i < N; i++) {
            if (i < j) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }

            let m = N / 2;
            while (m >= 1 && j >= m) {
                j -= m;
                m /= 2;
            }
            j += m;
        }

        // FFT computation
        for (let len = 2; len <= N; len *= 2) {
            const angle = -2 * Math.PI / len;
            const wlen_real = Math.cos(angle);
            const wlen_imag = Math.sin(angle);

            for (let i = 0; i < N; i += len) {
                let w_real = 1;
                let w_imag = 0;

                for (let j = 0; j < len / 2; j++) {
                    const u_real = real[i + j];
                    const u_imag = imag[i + j];

                    const t_real = w_real * real[i + j + len / 2] - w_imag * imag[i + j + len / 2];
                    const t_imag = w_real * imag[i + j + len / 2] + w_imag * real[i + j + len / 2];

                    real[i + j] = u_real + t_real;
                    imag[i + j] = u_imag + t_imag;

                    real[i + j + len / 2] = u_real - t_real;
                    imag[i + j + len / 2] = u_imag - t_imag;

                    const temp_real = w_real;
                    w_real = w_real * wlen_real - w_imag * wlen_imag;
                    w_imag = temp_real * wlen_imag + w_imag * wlen_real;
                }
            }
        }
    }

    // ================================================
    // UI HELPERS
    // ================================================

    updateMachineStatus(status) {
        this.machineStatus.textContent = status;

        // Animate gauge needles based on status
        const needles = document.querySelectorAll('.gauge-needle');
        const angle = status.includes('en cours') ? 45 : 0;

        needles.forEach(needle => {
            needle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
        });
    }
}

// ================================================
// SCROLL EFFECTS WAHOU
// ================================================

class ScrollEffects {
    constructor() {
        this.lastScrollY = window.scrollY;
        this.scrollTimeout = null;
        this.particles = [];

        this.init();
    }

    init() {
        // Créer l'élément burst
        this.burstElement = document.createElement('div');
        this.burstElement.className = 'scroll-burst';
        document.body.appendChild(this.burstElement);

        // Intersection Observer pour les éléments qui apparaissent
        this.setupIntersectionObserver();

        // Écouter le scroll
        window.addEventListener('scroll', () => this.handleScroll());

        // Initialiser - rendre visible les éléments déjà visibles
        this.checkVisibleElements();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.createScrollBurst();
                    this.createParticles();
                }
            });
        }, options);

        // Observer les panneaux
        document.querySelectorAll('.control-panel, .spectrogram-panel').forEach(panel => {
            this.observer.observe(panel);
        });
    }

    checkVisibleElements() {
        // Rendre visible les éléments déjà dans le viewport au chargement
        const panels = document.querySelectorAll('.control-panel, .spectrogram-panel');
        panels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                panel.classList.add('visible');
            }
        });
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        const scrollDelta = Math.abs(currentScrollY - this.lastScrollY);

        // Ajouter classe scrolling au body
        document.body.classList.add('scrolling');

        // Effet glow sur les panels visibles
        if (scrollDelta > 5) {
            this.applyScrollGlow();
        }

        // Retirer la classe après 200ms d'inactivité
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            document.body.classList.remove('scrolling');
            this.removeScrollGlow();
        }, 200);

        this.lastScrollY = currentScrollY;
    }

    applyScrollGlow() {
        document.querySelectorAll('.panel-frame').forEach(frame => {
            const rect = frame.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                frame.classList.add('scroll-glow');
                setTimeout(() => frame.classList.remove('scroll-glow'), 600);
            }
        });
    }

    removeScrollGlow() {
        document.querySelectorAll('.panel-frame').forEach(frame => {
            frame.classList.remove('scroll-glow');
        });
    }

    createScrollBurst() {
        this.burstElement.classList.remove('active');
        void this.burstElement.offsetWidth; // Force reflow
        this.burstElement.classList.add('active');

        setTimeout(() => {
            this.burstElement.classList.remove('active');
        }, 800);
    }

    createParticles() {
        const colors = [
            'rgba(255, 215, 0, 0.8)',    // Or
            'rgba(255, 140, 0, 0.8)',    // Orange
            'rgba(255, 20, 147, 0.8)',   // Rose
            'rgba(255, 0, 50, 0.8)',     // Rouge
            'rgba(0, 150, 255, 0.8)'     // Bleu
        ];

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'scroll-particle';
                particle.style.left = `${Math.random() * window.innerWidth}px`;
                particle.style.top = `${window.innerHeight / 2 + (Math.random() - 0.5) * 200}px`;
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

                // Animation aléatoire
                const randomX = (Math.random() - 0.5) * 400;
                particle.style.setProperty('--random-x', `${randomX}px`);

                document.body.appendChild(particle);

                // Activer l'animation
                requestAnimationFrame(() => {
                    particle.classList.add('active');
                });

                // Nettoyer
                setTimeout(() => {
                    particle.remove();
                }, 1500);
            }, i * 30);
        }
    }
}

// ================================================
// INITIALIZE APPLICATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    const analyzer = new SpectralAnalyzer();
    const scrollEffects = new ScrollEffects();
});
