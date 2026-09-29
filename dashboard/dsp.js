export function applyWindow(signal, type) {
    const N = signal.length;
    const windowed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        let w = 1;
        if (type === 'hamming') w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
        else if (type === 'hann') w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        else if (type === 'blackman') w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
        windowed[i] = signal[i] * w;
    }
    return windowed;
}

export function computeFFT(signal) {
    let N = 1;
    while (N < signal.length) N <<= 1;
    
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    real.set(signal);
    
    // Bit reversal
    let j = 0;
    for (let i = 0; i < N - 1; i++) {
        if (i < j) {
            let temp = real[i]; real[i] = real[j]; real[j] = temp;
        }
        let k = N >> 1;
        while (k <= j) { j -= k; k >>= 1; }
        j += k;
    }
    
    // Cooley-Tukey
    for (let size = 2; size <= N; size *= 2) {
        const halfsize = size / 2;
        const tablestep = N / size;
        for (let i = 0; i < N; i += size) {
            for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                const tpx = real[j + halfsize] * Math.cos(-2 * Math.PI * k / N) - imag[j + halfsize] * Math.sin(-2 * Math.PI * k / N);
                const tpy = real[j + halfsize] * Math.sin(-2 * Math.PI * k / N) + imag[j + halfsize] * Math.cos(-2 * Math.PI * k / N);
                real[j + halfsize] = real[j] - tpx;
                imag[j + halfsize] = imag[j] - tpy;
                real[j] += tpx;
                imag[j] += tpy;
            }
        }
    }
    
    const magnitudes = new Float32Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
        magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / (N / 2);
    }
    return { real, imag, magnitudes };
}

export function magnitudesToDB(magnitudes) {
    const db = new Float32Array(magnitudes.length);
    for (let i = 0; i < magnitudes.length; i++) {
        db[i] = 20 * Math.log10(Math.max(magnitudes[i], 1e-10));
    }
    return db;
}

export function computeSpectrogram(signal, fftSize = 256, hopSize = 64) {
    const frames = [];
    for (let i = 0; i < signal.length - fftSize; i += hopSize) {
        const frame = signal.slice(i, i + fftSize);
        const windowed = applyWindow(frame, 'hamming');
        const fft = computeFFT(windowed);
        frames.push(fft.magnitudes);
    }
    return frames;
}

export function computeMetrics(magnitudes, sampleRate) {
    const N = magnitudes.length * 2;
    let maxIdx = 0;
    let maxMag = 0;
    
    // Calculate noise floor (mean)
    let sum = 0;
    for (let i = 0; i < magnitudes.length; i++) {
        if (magnitudes[i] > maxMag) { maxMag = magnitudes[i]; maxIdx = i; }
        sum += magnitudes[i];
    }
    const noiseFloor = (sum - maxMag) / (magnitudes.length - 1 || 1);
    const snr = maxMag > 0 ? 20 * Math.log10(maxMag / Math.max(noiseFloor, 1e-10)) : 0;
    
    const peakFreqSim = (maxIdx * sampleRate / N);
    const peakFreq = (peakFreqSim * 10) / 1000; // scale up by 10, to kHz
    
    // -3dB Bandwidth
    const threshold3db = maxMag * Math.pow(10, -3/20);
    let leftIdx = maxIdx;
    while (leftIdx > 0 && magnitudes[leftIdx] > threshold3db) leftIdx--;
    let rightIdx = maxIdx;
    while (rightIdx < magnitudes.length - 1 && magnitudes[rightIdx] > threshold3db) rightIdx++;
    
    const bwSim = ((rightIdx - leftIdx) * sampleRate / N);
    const bandwidth = (bwSim * 10) / 1000;

    // Sidelobe level
    let maxSidelobe = 0;
    for (let i = 0; i < magnitudes.length; i++) {
        if (i < leftIdx || i > rightIdx) {
            if (magnitudes[i] > maxSidelobe) maxSidelobe = magnitudes[i];
        }
    }
    const sidelobeLevel = maxMag > 0 && maxSidelobe > 0 ? 20 * Math.log10(maxSidelobe / maxMag) : -60;

    return { peakFreq, bandwidth, snr, sidelobeLevel };
}
