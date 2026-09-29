import { SonarSimulator } from './simulator.js';
import { computeFFT, magnitudesToDB, computeMetrics } from './dsp.js';
import { WaveformRenderer, SpectrogramRenderer, FFTRenderer } from './renderer.js';
import { VoiceEngine } from './voice.js';

let sim, waveRenderer, spectroRenderer, fftRenderer, voice;
let isRunning = false;
let runInterval = null;
let lastEnvClass = '';

const FSM_STATES = ['BOOT','SELF_TEST','IDLE','SENSE','CLASSIFY','OPTIMIZE','GENERATE','WINDOW','TRANSMIT','MEASURE','EVALUATE','FAULT'];
const FSM_CYCLE = ['IDLE','SENSE','CLASSIFY','OPTIMIZE','GENERATE','WINDOW','TRANSMIT','MEASURE','EVALUATE'];
let fsmIdx = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Simulation and rendering
    sim = new SonarSimulator();
    waveRenderer = new WaveformRenderer(document.getElementById('waveform-canvas'));
    spectroRenderer = new SpectrogramRenderer(document.getElementById('spectro-canvas'));
    fftRenderer = new FFTRenderer(document.getElementById('fft-canvas'));
    voice = new VoiceEngine();
    
    bindControls();
    
    // Auto-start simulation after a short delay
    setTimeout(() => {
        const startBtn = document.getElementById('start-btn');
        if(startBtn) startBtn.click();
    }, 800);

    // FSM Timer
    setInterval(() => {
        if (isRunning) {
            fsmIdx = (fsmIdx + 1) % FSM_CYCLE.length;
            updateFSMDisplay(FSM_CYCLE[fsmIdx]);
        }
    }, 300);
});

function bindControls() {
    // Start / Stop Button
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        isRunning = !isRunning;
        if (isRunning) {
            startBtn.textContent = '⏹ STOP TRANSMISSION';
            startBtn.classList.add('active');
            document.getElementById('system-status-dot').classList.add('active');
            document.getElementById('system-status-text').textContent = 'TRANSMITTING';
            runInterval = setInterval(runFrame, 33); // ~30fps
        } else {
            startBtn.textContent = '▶ START TRANSMISSION';
            startBtn.classList.remove('active');
            document.getElementById('system-status-dot').classList.remove('active');
            document.getElementById('system-status-text').textContent = 'SYSTEM READY';
            clearInterval(runInterval);
            updateFSMDisplay('IDLE');
        }
    });

    // Env Sliders
    const sliders = ['turbidity', 'depth', 'temp', 'salinity', 'battery'];
    sliders.forEach(id => {
        const el = document.getElementById(`${id}-slider`);
        el.addEventListener('input', (e) => {
            const val = e.target.value;
            document.getElementById(`${id}-val`).textContent = val;
            updateSimulatorEnv();
        });
    });

    // Mode Radios
    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            sim.setMode(e.target.value);
        });
    });

    // Window Dropdown
    const winSelect = document.getElementById('window-select');
    winSelect.addEventListener('change', (e) => {
        sim.setWindow(e.target.value);
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetName = btn.dataset.preset;
            const vals = sim.applyPreset(presetName);
            
            document.getElementById('turbidity-slider').value = vals.turbidity;
            document.getElementById('depth-slider').value = vals.depth;
            document.getElementById('temp-slider').value = vals.temperature;
            document.getElementById('salinity-slider').value = vals.salinity;
            document.getElementById('battery-slider').value = vals.battery;
            
            updateSliderDisplays();
            
            const params = sim.getParams();
            if (voice.enabled) {
                voice.announceEnvironmentChange(params.envClass);
            }
        });
    });

    // Voice Toggle
    const voiceBtn = document.getElementById('voice-toggle');
    voiceBtn.addEventListener('click', () => {
        voice.enabled = !voice.enabled;
        voiceBtn.textContent = voice.enabled ? '🔊 VOICE ON' : '🔇 VOICE OFF';
        if (voice.enabled) voice.speak('Voice system activated.');
    });

    // Self Test
    document.getElementById('self-test-btn').addEventListener('click', runSelfTest);
    
    // Export CSV
    document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
}

function updateSliderDisplays() {
    const ids = ['turbidity', 'depth', 'temp', 'salinity', 'battery'];
    ids.forEach(id => {
        const el = document.getElementById(`${id}-slider`);
        if (el) {
            document.getElementById(`${id}-val`).textContent = el.value;
        }
    });
}

function updateSimulatorEnv() {
    sim.setEnvironment({
        turbidity: parseInt(document.getElementById('turbidity-slider').value),
        depth: parseInt(document.getElementById('depth-slider').value),
        temperature: parseInt(document.getElementById('temp-slider').value),
        salinity: parseInt(document.getElementById('salinity-slider').value),
        battery: parseInt(document.getElementById('battery-slider').value)
    });
}

function updateFSMDisplay(activeState) {
    FSM_STATES.forEach(state => {
        const el = document.getElementById(`state-${state}`);
        if (el) {
            if (state === activeState) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
    set('fsm-state-display', activeState);
}

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function updateScoreBar(key, score, maxJ) {
    const fill = document.getElementById(`${key}-score-bar`);
    const val = document.getElementById(`${key}-score-val`);
    if (!fill || !val) return;
    const pct = maxJ > 0 ? (score.J / maxJ * 100) : 50;
    fill.style.width = `${pct}%`;
    fill.className = 'score-bar-fill' + (score.selected ? ' winner' : '');
    val.textContent = score.J.toFixed(3);
}

function addLogRow(rowData) {
    const tbody = document.getElementById('data-log-body');
    const tr = document.createElement('tr');
    rowData.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
    });
    tbody.prepend(tr);
    if (tbody.children.length > 50) {
        tbody.removeChild(tbody.lastChild);
    }
}

function exportCSV() {
    const tbody = document.getElementById('data-log-body');
    let csv = "Timestamp,Score,Turb,Depth,Temp,Mode,Fc,BW,Pulse,Amp,Quality\n";
    for(let row of tbody.children) {
        let cells = Array.from(row.children).map(td => td.textContent);
        csv += cells.join(",") + "\n";
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asie_log.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function runSelfTest() {
    const wasRunning = isRunning;
    if(wasRunning) document.getElementById('start-btn').click(); // stop
    
    updateFSMDisplay('SELF_TEST');
    if(voice.enabled) voice.speak("Initiating system self-test.");
    
    const leds = ['adc', 'dma', 'dac', 'tmr', 'mem'];
    leds.forEach(l => document.getElementById(`led-${l}`).classList.remove('on'));
    
    let i = 0;
    const testInterval = setInterval(() => {
        if (i < leds.length) {
            document.getElementById(`led-${leds[i]}`).classList.add('on');
            i++;
        } else {
            clearInterval(testInterval);
            if(voice.enabled) voice.speak("Self test complete. All systems nominal.");
            setTimeout(() => {
                leds.forEach(l => document.getElementById(`led-${l}`).classList.remove('on'));
                updateFSMDisplay('IDLE');
            }, 1500);
        }
    }, 500);
}

function runFrame() {
    const result = sim.generatePulse();
    const { waveform, params, metrics, optimizerScores, digitalTwin, loopInfo } = result;
    
    // Compute FFT
    const fft = computeFFT(waveform);
    const magsDB = magnitudesToDB(fft.magnitudes);
    const sigMetrics = computeMetrics(fft.magnitudes, sim.sampleRate);
    
    // Render canvases
    waveRenderer.draw(waveform, params);
    spectroRenderer.addColumn(fft.magnitudes);
    spectroRenderer.draw();
    fftRenderer.draw(magsDB, sim.sampleRate, sigMetrics);
    
    // Update Waveform Params
    set('fc-display', `${params.fc.toFixed(1)} kHz`);
    set('bw-display', `${params.bw.toFixed(1)} kHz`);
    set('pulse-display', `${params.duration.toFixed(2)} ms`);
    set('amp-display', `${params.amplitude.toFixed(1)} %`);
    set('f0-display', `${params.f0.toFixed(1)} kHz`);
    set('f1-display', `${params.f1.toFixed(1)} kHz`);
    set('mode-display', params.mode.toUpperCase());
    set('window-display', params.window.toUpperCase());
    
    // Update FFT metrics
    set('peak-freq-display', sigMetrics.peakFreq.toFixed(1));
    set('bw-metric-display', sigMetrics.bandwidth.toFixed(1));
    // Note: using DSP metrics for the generic FFT display, but simulator loopInfo for SQ Analyzer per requirements
    
    // Update Signal Quality Analyzer
    const freqErrPct = digitalTwin.fcError.toFixed(2);
    const bwErrPct = digitalTwin.bwError.toFixed(2);
    set('freq-err-display', `${freqErrPct}%`);
    set('bw-err-display', `${bwErrPct}%`);
    set('snr-display', loopInfo.snr.toFixed(1));
    set('sidelobe-display', loopInfo.sidelobeDb.toFixed(1));
    
    const isValid = loopInfo.snr > 20 && parseFloat(freqErrPct) < 5;
    const qStatus = document.getElementById('quality-status');
    qStatus.textContent = isValid ? '✓ VALID' : '✗ INVALID';
    qStatus.className = isValid ? 'quality-valid' : 'quality-invalid';
    
    // Digital Twin
    set('expected-fc', `${digitalTwin.expectedFc.toFixed(1)} kHz`);
    set('measured-fc', `${digitalTwin.measuredFc.toFixed(1)} kHz`);
    set('fc-twin-error', `${digitalTwin.fcError.toFixed(2)}%`);
    set('expected-bw', `${digitalTwin.expectedBw.toFixed(1)} kHz`);
    set('measured-bw', `${digitalTwin.measuredBw.toFixed(1)} kHz`);
    
    // Optimizer Scores
    const scores = optimizerScores;
    const maxJ = Math.max(scores.lfm.J, scores.geometric.J, scores.phase.J);
    updateScoreBar('lfm', scores.lfm, maxJ);
    updateScoreBar('geo', scores.geometric, maxJ);
    updateScoreBar('phase', scores.phase, maxJ);
    set('optimizer-selected', scores.lfm.selected ? 'LFM' : (scores.geometric.selected ? 'GEO' : 'PHASE'));
    
    // Power Monitor
    set('cpu-display', `${metrics.cpuLoad.toFixed(1)}%`);
    set('dma-status', metrics.dmaActive ? 'ACTIVE' : 'IDLE');
    set('power-mode', metrics.powerMode);
    set('timer-freq', metrics.timerFreq);
    set('buffer-size', `${metrics.bufferSize} samples`);
    set('pulse-energy', `${metrics.pulseEnergyMj.toFixed(3)} mJ`);
    set('battery-time', `~${metrics.batteryTimeHours.toFixed(1)} hrs`);
    
    // Closed-Loop Info
    set('loop-iteration', `#${loopInfo.iteration}`);
    const lrEl = document.getElementById('loop-result');
    lrEl.textContent = loopInfo.result;
    lrEl.className = loopInfo.result === 'ACCEPTED' ? 'loop-accepted' : 'loop-reopt';
    set('reopt-count', loopInfo.reoptCount);
    set('pulse-count', loopInfo.pulseCount);
    
    // Environment badge
    const badge = document.getElementById('env-class-badge');
    badge.textContent = params.envClass;
    badge.style.backgroundColor = params.envColor;
    set('env-score-display', `Score: ${params.envScore.toFixed(3)}`);
    
    // Voice
    if (params.envClass !== lastEnvClass && voice.enabled) {
        voice.announceEnvironmentChange(params.envClass);
        lastEnvClass = params.envClass;
    }
    
    // Log row
    const ts = new Date().toISOString().substring(11,19);
    const row = [
        ts, 
        params.envScore.toFixed(2), 
        params.turbidity || document.getElementById('turbidity-slider').value,
        params.depth || document.getElementById('depth-slider').value,
        params.temperature || document.getElementById('temp-slider').value,
        params.mode.toUpperCase(), 
        params.fc.toFixed(1), 
        params.bw.toFixed(1), 
        params.duration.toFixed(2), 
        params.amplitude.toFixed(1), 
        isValid ? 'VALID' : 'INVALID'
    ];
    addLogRow(row);
}
