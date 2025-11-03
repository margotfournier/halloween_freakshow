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

        // DOM elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.indicator = document.getElementById('recordingIndicator');
        this.indicatorText = this.indicator.querySelector('.indicator-text');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.spectrogramCanvas = document.getElementById('spectrogramCanvas');
        this.machineStatus = document.getElementById('machineStatus');

        // Canvas contexts
        this.waveCtx = this.waveformCanvas.getContext('2d');
        this.specCtx = this.spectrogramCanvas.getContext('2d');

        // Spectrogram data
        this.spectrogramData = [];

        this.init();
    }

    init() {
        // Event listeners
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.analyzeBtn.addEventListener('click', () => this.analyzeAudio());

        this.updateMachineStatus('Machine au repos');
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
                this.analyzeBtn.disabled = false;
                this.updateMachineStatus('Enregistrement terminé - Prêt à analyser');
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                alert('Erreur pendant l\'enregistrement: ' + event.error.message);
            };

            this.mediaRecorder.start(100); // Collecter les données toutes les 100ms
            this.isRecording = true;
            console.log('Enregistrement démarré');

            // UI updates
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.recordBtn.classList.add('recording');
            this.indicatorText.textContent = 'Enregistrement en cours...';
            this.updateMachineStatus('Enregistrement en cours...');

            // Start waveform visualization
            this.drawWaveform();

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

            // UI updates
            this.recordBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.recordBtn.classList.remove('recording');
            this.indicatorText.textContent = 'Enregistrement sauvegardé';

            // Stop animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }

    // ================================================
    // WAVEFORM VISUALIZATION
    // ================================================

    drawWaveform() {
        if (!this.isRecording) return;

        this.analyser.getByteTimeDomainData(this.dataArray);

        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;

        this.waveCtx.fillStyle = '#0f0a08';
        this.waveCtx.fillRect(0, 0, width, height);

        this.waveCtx.lineWidth = 2;
        this.waveCtx.strokeStyle = '#d4af37';
        this.waveCtx.beginPath();

        const sliceWidth = width / this.dataArray.length;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.waveCtx.moveTo(x, y);
            } else {
                this.waveCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.waveCtx.lineTo(width, height / 2);
        this.waveCtx.stroke();

        this.animationId = requestAnimationFrame(() => this.drawWaveform());
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
        this.analyzeBtn.disabled = true;

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
            this.analyzeBtn.disabled = false;

        } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            alert('Erreur lors de l\'analyse audio: ' + error.message);
            this.updateMachineStatus('Erreur d\'analyse');
            this.analyzeBtn.disabled = false;
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
// INITIALIZE APPLICATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    const analyzer = new SpectralAnalyzer();
});
