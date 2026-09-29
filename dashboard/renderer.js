function resizeCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { width: rect.width, height: rect.height, ctx };
}

export class WaveformRenderer {
    constructor(canvas) {
        this.canvas = canvas;
    }

    draw(waveform, params) {
        const { width, height, ctx } = resizeCanvas(this.canvas);
        
        ctx.clearRect(0, 0, width, height);
        
        // Grid
        ctx.strokeStyle = '#1a2744';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<height; i+=height/4) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
        for(let i=0; i<width; i+=width/10) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
        ctx.stroke();

        if (!waveform || waveform.length === 0) return;

        // Waveform
        const drawWave = (alpha, lw) => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
            ctx.lineWidth = lw;
            const step = Math.max(1, Math.floor(waveform.length / width));
            for (let i = 0; i < width; i++) {
                const dataIdx = i * step;
                if (dataIdx >= waveform.length) break;
                const y = height / 2 - (waveform[dataIdx] * height / 2);
                if (i === 0) ctx.moveTo(i, y);
                else ctx.lineTo(i, y);
            }
            ctx.stroke();
        };

        drawWave(0.3, 4); // Glow
        drawWave(1.0, 1.5); // Core

        // Overlay text
        ctx.fillStyle = '#c8d6e5';
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(`Mode: ${params.mode.toUpperCase()}`, 10, 20);
        ctx.fillText(`Win: ${params.window.toUpperCase()}`, 10, 35);
    }
}

export class SpectrogramRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.history = []; // Array of magnitudes
        this.maxHistory = 500;
    }

    addColumn(magnitudes) {
        this.history.push(magnitudes);
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    getColor(val, maxVal) {
        const ratio = Math.max(0, Math.min(1, val / maxVal));
        // dark blue -> cyan -> yellow -> red
        if (ratio < 0.33) return `rgb(0, 0, ${Math.floor(ratio*3*255)})`;
        if (ratio < 0.66) return `rgb(0, ${Math.floor((ratio-0.33)*3*255)}, 255)`;
        if (ratio < 0.9) return `rgb(${Math.floor((ratio-0.66)*3*255)}, 255, ${255 - Math.floor((ratio-0.66)*3*255)})`;
        return `rgb(255, ${255 - Math.floor((ratio-0.9)*10*255)}, 0)`;
    }

    draw() {
        const { width, height, ctx } = resizeCanvas(this.canvas);
        ctx.clearRect(0, 0, width, height);

        if (this.history.length === 0) return;

        this.maxHistory = Math.floor(width);
        const colWidth = width / this.maxHistory;
        const numBins = this.history[0].length;
        const binHeight = height / numBins;

        for (let c = 0; c < this.history.length; c++) {
            const x = width - (this.history.length - c) * colWidth;
            const mags = this.history[c];
            // find local max for scaling (or fixed)
            const maxMag = 0.05; 
            for (let b = 0; b < numBins; b++) {
                ctx.fillStyle = this.getColor(mags[b], maxMag);
                // Inverse Y (low freq at bottom)
                ctx.fillRect(x, height - (b + 1) * binHeight, Math.ceil(colWidth), Math.ceil(binHeight));
            }
        }
    }
}

export class FFTRenderer {
    constructor(canvas) {
        this.canvas = canvas;
    }

    draw(magnitudesDB, sampleRate, metrics) {
        const { width, height, ctx } = resizeCanvas(this.canvas);
        ctx.clearRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = '#1a2744';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<height; i+=height/5) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
        ctx.stroke();

        if (!magnitudesDB || magnitudesDB.length === 0) return;

        const minDB = -100;
        const maxDB = 0;
        const range = maxDB - minDB;

        // Path
        ctx.beginPath();
        for (let i = 0; i < width; i++) {
            const dataIdx = Math.floor(i * magnitudesDB.length / width);
            const val = Math.max(minDB, Math.min(maxDB, magnitudesDB[dataIdx]));
            const y = height - ((val - minDB) / range) * height;
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }

        ctx.strokeStyle = '#00b4d8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fill
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 180, 216, 0.4)');
        grad.addColorStop(1, 'rgba(0, 180, 216, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Mark peak
        if (metrics && metrics.peakFreq > 0) {
            const maxFreqKHz = 1000;
            const x = (metrics.peakFreq / maxFreqKHz) * width;
            
            ctx.beginPath();
            ctx.strokeStyle = '#ff6b35';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
