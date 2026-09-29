/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Sonar Simulator Service (SonarSimulator.js)
 * Preserves and extends all mathematical waveform generators,
 * environmental adaptation formulas, digital twin physics, power metrics,
 * and cost function calculations.
 */

export class SonarSimulator {
    constructor(sampleRate = 200000) {
        this.sampleRate = sampleRate;
        this.env = { turbidity: 40, depth: 45, temperature: 22, salinity: 35, battery: 75 };
        this.mode = 'auto'; // 'auto', 'lfm', 'geometric', 'phase'
        this.strategy = 'Balanced'; // 'Resolution Priority', 'Range Priority', 'Balanced', 'Energy Saving'
        this.windowType = 'hamming';
        this.pulseCount = 0;
        this.reoptCount = 0;
        this.activeFault = null;
        
        // Optimizer cost function weights
        this.weights = { w1: 0.25, w2: 0.30, w3: 0.25, w4: 0.20 };
        
        // Manual override parameters for Waveform Lab
        this.labParams = null;
        
        // Self-test LEDs / state
        this.selfTestStatus = {
            adc: false,
            dac: false,
            dma: false,
            tmr: false,
            mem: false,
            wf: false,
            fft: false,
            serial: false,
            power: false
        };
    }

    setEnvironment(env) {
        this.env = { ...this.env, ...env };
    }

    setMode(mode) {
        this.mode = mode;
    }

    setStrategy(strategy) {
        this.strategy = strategy;
    }

    setWindow(type) {
        this.windowType = type;
    }

    setOptimizerWeights(w1, w2, w3, w4) {
        this.weights = { w1, w2, w3, w4 };
    }

    setLabParams(params) {
        this.labParams = params;
    }

    triggerFault(faultName) {
        this.activeFault = faultName;
    }

    clearFault() {
        this.activeFault = null;
    }

    getEnvScoreAndClass() {
        let E = 0.35 * (this.env.turbidity / 100) + 
                0.30 * (this.env.depth / 100) + 
                0.15 * (this.env.salinity / 45) + 
                0.10 * ((50 - this.env.temperature) / 50) + 
                0.10 * ((100 - this.env.battery) / 100);
        E = Math.max(0, Math.min(1, E));

        let envClass = 'MODERATE';
        let envColor = '#00a8ff';

        if (this.env.battery < 25) {
            envClass = 'LOW BATTERY';
            envColor = '#ffaa00';
        } else if (this.env.turbidity > 80 && this.env.depth < 35) {
            envClass = 'TURBULENT';
            envColor = '#ff6600';
        } else if (E < 0.25) { 
            envClass = 'CLEAR SHALLOW'; 
            envColor = '#00ffc8'; 
        } else if (E < 0.45) { 
            envClass = 'MODERATE'; 
            envColor = '#00a8ff'; 
        } else if (E < 0.65) { 
            envClass = 'MURKY'; 
            envColor = '#ffcc00'; 
        } else { 
            envClass = 'DEEP MURKY'; 
            envColor = '#ff3366'; 
        }

        return { E, envClass, envColor };
    }

    getParams(isReopt = false) {
        if (this.labParams) {
            return {
                ...this.labParams,
                envClass: 'LAB OVERRIDE',
                envScore: 0.5,
                envColor: '#9d4edd'
            };
        }

        const { E, envClass, envColor } = this.getEnvScoreAndClass();
        
        // Base mapping derived from environmental score
        let fc = 450 - 300 * E;        // 150 - 450 kHz
        let bw = 120 - 80 * E;         // 40 - 120 kHz
        let duration = 1 + 5 * E;      // 1 - 6 ms
        let amplitude = 50 + 40 * E;   // 50 - 90 %

        // Strategy modifiers
        if (this.strategy === 'Resolution Priority') {
            bw *= 1.3;
            duration *= 0.7;
        } else if (this.strategy === 'Range Priority') {
            fc *= 0.8;
            duration *= 1.4;
            amplitude *= 1.1;
        } else if (this.strategy === 'Energy Saving') {
            amplitude *= 0.6;
            duration *= 0.8;
        }

        if (this.env.battery < 30) {
            amplitude *= 0.75;
        }

        if (isReopt) {
            fc *= (1 + (Math.random() - 0.5) * 0.08);
            bw *= (1 + (Math.random() - 0.5) * 0.08);
            duration *= (1 + (Math.random() - 0.5) * 0.08);
            amplitude *= (1 + (Math.random() - 0.5) * 0.08);
        }

        fc = Math.max(50, Math.min(500, fc));
        bw = Math.max(10, Math.min(200, bw));
        duration = Math.max(0.5, Math.min(10, duration));
        amplitude = Math.max(10, Math.min(100, amplitude));

        return { fc, bw, duration, amplitude, envClass, envScore: E, envColor };
    }

    calculateCost(mode, amp, dur, bw) {
        const energy = Math.pow(amp / 100, 2) * (dur / 6);
        const sidelobePenalty = { lfm: 0.6, geometric: 0.8, phase: 0.2 }[mode] || 0.5;
        const resPenalty = 1 - Math.min(1, bw / 150);
        const rangePenalty = 1 - Math.min(1, (dur / 6) * (amp / 90));
        
        const { w1, w2, w3, w4 } = this.weights;
        const J = w1 * energy + w2 * sidelobePenalty + w3 * resPenalty + w4 * rangePenalty;
        return { J, energy, sidelobePenalty, resPenalty, rangePenalty };
    }

    applyPreset(presetName) {
        const presets = {
            clear:     { turbidity: 5,  depth: 10, temperature: 28, salinity: 33, battery: 100 },
            moderate:  { turbidity: 40, depth: 45, temperature: 22, salinity: 35, battery: 75 },
            murky:     { turbidity: 75, depth: 65, temperature: 18, salinity: 38, battery: 60 },
            deepMurky: { turbidity: 90, depth: 90, temperature: 8,  salinity: 40, battery: 40 },
            lowBattery:{ turbidity: 40, depth: 40, temperature: 20, salinity: 35, battery: 15 },
            turbulent: { turbidity: 85, depth: 30, temperature: 15, salinity: 42, battery: 55 }
        };
        const selected = presets[presetName] || presets.moderate;
        this.setEnvironment(selected);
        return selected;
    }

    generateWaveform(params, selectedMode) {
        const { fc, bw, duration, amplitude } = params;
        const f0 = (fc - bw/2) * 1000;
        const f1 = (fc + bw/2) * 1000;
        const T = Math.max(0.0005, duration / 1000);
        const numSamples = Math.max(100, Math.floor(T * this.sampleRate));
        const waveform = new Float32Array(numSamples);
        const A = amplitude / 100;

        // Visual scaling: divide frequencies by 10 for canvas visualization
        const visScale = 0.1;
        const f0_v = f0 * visScale;
        const f1_v = f1 * visScale;

        if (selectedMode === 'lfm') {
            const k = (f1_v - f0_v) / T;
            for (let i = 0; i < numSamples; i++) {
                const t = i / this.sampleRate;
                waveform[i] = A * Math.sin(2 * Math.PI * (f0_v * t + 0.5 * k * t * t));
            }
        } else if (selectedMode === 'geometric') {
            const r = f1_v / Math.max(1, f0_v);
            let phase = 0;
            for (let i = 0; i < numSamples; i++) {
                const t = i / this.sampleRate;
                const ft = f0_v * Math.pow(Math.max(0.01, r), t / T);
                waveform[i] = A * Math.sin(2 * Math.PI * phase);
                phase += ft / this.sampleRate;
            }
        } else if (selectedMode === 'phase') {
            const barker13 = [1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1];
            const chipDuration = T / barker13.length;
            for (let i = 0; i < numSamples; i++) {
                const t = i / this.sampleRate;
                const chipIdx = Math.min(Math.floor(t / chipDuration), barker13.length - 1);
                const phaseCode = barker13[chipIdx] === 1 ? 0 : Math.PI;
                waveform[i] = A * Math.sin(2 * Math.PI * fc * 1000 * visScale * t + phaseCode);
            }
        }

        // Apply Windowing
        if (this.windowType !== 'none') {
            for (let i = 0; i < numSamples; i++) {
                const n = i;
                const N = numSamples - 1;
                let w = 1;
                if (this.windowType === 'hamming') {
                    w = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / N);
                } else if (this.windowType === 'hann') {
                    w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / N));
                } else if (this.windowType === 'blackman') {
                    w = 0.42 - 0.5 * Math.cos((2 * Math.PI * n) / N) + 0.08 * Math.cos((4 * Math.PI * n) / N);
                }
                waveform[i] *= w;
            }
        }

        return waveform;
    }

    generatePulse() {
        this.pulseCount++;
        let isReopt = false;
        let loopResult = 'ACCEPTED';
        let loopIteration = 1;

        let params = this.getParams(false);
        const { E } = this.getEnvScoreAndClass();

        // Auto Optimizer calculation
        const modes = ['lfm', 'geometric', 'phase'];
        let optimizerScores = {};
        let bestMode = 'lfm';
        let minJ = Infinity;

        modes.forEach(m => {
            const cost = this.calculateCost(m, params.amplitude, params.duration, params.bw);
            optimizerScores[m] = { ...cost, selected: false };
            if (cost.J < minJ) {
                minJ = cost.J;
                bestMode = m;
            }
        });

        const selectedMode = this.mode === 'auto' ? bestMode : this.mode;
        if (optimizerScores[selectedMode]) {
            optimizerScores[selectedMode].selected = true;
        }

        // Closed loop adaptation simulation
        if (E > 0.75 && Math.random() < 0.4 && !this.labParams) {
            isReopt = true;
            this.reoptCount++;
            loopResult = 'RE-OPTIMIZED';
            loopIteration = 2;
            params = this.getParams(true);
        }

        const waveform = this.generateWaveform(params, selectedMode);

        // Physics metrics simulation
        const snr = Math.max(5, 28 - (E * 16) + (params.amplitude / 100 * 10) + (Math.random() - 0.5) * 2);
        const sidelobeDb = selectedMode === 'phase' ? -22 : (this.windowType !== 'none' ? -38 : -13);

        const expectedFc = params.fc;
        const expectedBw = params.bw;
        const measuredFc = params.fc * (1 + (Math.random() - 0.5) * 0.025);
        const measuredBw = params.bw * (1 + (Math.random() - 0.5) * 0.035);
        
        const fcError = Math.abs((measuredFc - expectedFc) / expectedFc * 100);
        const bwError = Math.abs((measuredBw - expectedBw) / expectedBw * 100);

        // Power & CPU Load metrics
        const baseCpu = 12.4; // DMA-driven base CPU load (~12%)
        const cpuDrivenCpu = 68.2; // CPU-driven benchmark load (~68%)
        const cpuLoad = baseCpu + (Math.random() * 2.5);
        
        const currentMa = (params.amplitude / 100) * 450 + 80;
        const voltage = 14.8; // 4S LiPo Nominal
        const avgPowerW = (currentMa * voltage) / 1000;
        const pulseEnergyMj = Math.pow(params.amplitude / 100, 2) * params.duration * 0.05;

        // Drain battery gradually if transmitting
        if (this.env.battery > 0 && this.pulseCount % 50 === 0) {
            this.env.battery = Math.max(0, this.env.battery - 1);
        }

        return {
            waveform,
            params: {
                ...params,
                f0: params.fc - params.bw/2,
                f1: params.fc + params.bw/2,
                mode: selectedMode,
                window: this.windowType
            },
            metrics: {
                cpuLoad,
                cpuDrivenCpu,
                dmaActive: true,
                powerMode: this.env.battery > 50 ? 'OPTIMAL' : (this.env.battery > 20 ? 'BALANCED' : 'ECO'),
                timerFreq: (this.sampleRate / 1000).toFixed(1) + ' kHz',
                bufferSize: waveform.length,
                pulseEnergyMj,
                avgPowerW,
                currentMa,
                voltage,
                batteryTimeHours: (this.env.battery * 0.14).toFixed(1)
            },
            optimizerScores,
            digitalTwin: {
                expectedFc, measuredFc, fcError,
                expectedBw, measuredBw, bwError,
                status: fcError < 3.0 ? 'MATCH' : (fcError < 6.0 ? 'WARNING' : 'OUT OF RANGE')
            },
            loopInfo: {
                iteration: loopIteration,
                result: loopResult,
                reoptCount: this.reoptCount,
                pulseCount: this.pulseCount,
                snr,
                sidelobeDb
            },
            fault: this.activeFault
        };
    }
}
