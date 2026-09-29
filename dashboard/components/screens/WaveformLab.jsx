/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 4 — Waveform Lab
 */

import React, { useState } from 'react';
import { useSonar } from '../../context/SonarContext.jsx';
import { CanvasVisualizer } from '../common/CanvasVisualizer.jsx';

export function WaveformLab() {
    const { latestFrame, setLabParams, setWaveformMode, setWindowType } = useSonar();
    const [selectedType, setSelectedType] = useState('lfm');
    const [startFreq, setStartFreq] = useState(250);
    const [endFreq, setEndFreq] = useState(350);
    const [duration, setDuration] = useState(3.5);
    const [amplitude, setAmplitude] = useState(80);
    const [windowFunc, setWindowFunc] = useState('hamming');
    const [compareWindow, setCompareWindow] = useState(false);

    if (!latestFrame) return <div>Loading Waveform Lab...</div>;

    const centerFreq = (startFreq + endFreq) / 2;
    const bandwidth = Math.abs(endFreq - startFreq);

    const handleApplyToTransmitter = () => {
        setWaveformMode(selectedType);
        setWindowType(windowFunc);
        setLabParams({
            fc: centerFreq,
            bw: bandwidth,
            duration: duration,
            amplitude: amplitude,
            f0: startFreq,
            f1: endFreq,
            mode: selectedType,
            window: windowFunc
        });
    };

    const handleReset = () => {
        setStartFreq(250);
        setEndFreq(350);
        setDuration(3.5);
        setAmplitude(80);
        setSelectedType('lfm');
        setWindowFunc('hamming');
        setLabParams(null);
    };

    return (
        <div className="screen-content waveform-lab">
            <div className="grid-2-col">
                {/* Left Parameter Panel */}
                <div className="card">
                    <div className="card-header">WAVEFORM ENGINEERING CONTROLS</div>

                    <div className="control-group">
                        <label>Waveform Type:</label>
                        <div className="tab-group">
                            <button className={`tab-btn ${selectedType === 'lfm' ? 'active' : ''}`} onClick={() => setSelectedType('lfm')}>LFM CHIRP</button>
                            <button className={`tab-btn ${selectedType === 'geometric' ? 'active' : ''}`} onClick={() => setSelectedType('geometric')}>GEO SWEEP</button>
                            <button className={`tab-btn ${selectedType === 'phase' ? 'active' : ''}`} onClick={() => setSelectedType('phase')}>PHASE CODED</button>
                        </div>
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Start Frequency (f0)</span>
                            <span className="slider-val">{startFreq} kHz</span>
                        </div>
                        <input type="range" min="50" max="450" value={startFreq} onChange={(e) => setStartFreq(parseFloat(e.target.value))} />
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>End Frequency (f1)</span>
                            <span className="slider-val">{endFreq} kHz</span>
                        </div>
                        <input type="range" min="100" max="500" value={endFreq} onChange={(e) => setEndFreq(parseFloat(e.target.value))} />
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Pulse Duration (T)</span>
                            <span className="slider-val">{duration} ms</span>
                        </div>
                        <input type="range" min="0.5" max="10" step="0.1" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} />
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Transmit Amplitude</span>
                            <span className="slider-val">{amplitude} %</span>
                        </div>
                        <input type="range" min="10" max="100" value={amplitude} onChange={(e) => setAmplitude(parseFloat(e.target.value))} />
                    </div>

                    <div className="control-group">
                        <label>Windowing Function:</label>
                        <select className="dropdown" value={windowFunc} onChange={(e) => setWindowFunc(e.target.value)}>
                            <option value="none">None (Rectangular)</option>
                            <option value="hamming">Hamming Window</option>
                            <option value="hann">Hann Window</option>
                            <option value="blackman">Blackman Window</option>
                        </select>
                    </div>

                    <div className="divider"></div>

                    <div className="btn-row">
                        <button className="btn-primary" onClick={handleApplyToTransmitter}>SEND TO TRANSMITTER</button>
                        <button className="btn-secondary" onClick={handleReset}>RESET DEFAULTS</button>
                    </div>
                </div>

                {/* Right Visualization Panel */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">
                            <span>REAL-TIME WAVEFORM VISUALIZATION</span>
                            <button className="btn-small" onClick={() => setCompareWindow(!compareWindow)}>
                                {compareWindow ? 'SHOW SINGLE WAVE' : 'COMPARE WINDOW'}
                            </button>
                        </div>

                        <CanvasVisualizer type="waveform" frame={latestFrame} height={220} />

                        <div className="lab-math-box">
                            <div className="math-title">FORMULA & MATHEMATICAL MODEL</div>
                            {selectedType === 'lfm' && (
                                <div className="math-code">
                                    f(t) = f₀ + k·t &nbsp;|&nbsp; k = (f₁ - f₀) / T <br />
                                    φ(t) = 2π(f₀t + 0.5kt²) &nbsp;|&nbsp; x(t) = A · sin(φ(t)) · w(t)
                                </div>
                            )}
                            {selectedType === 'geometric' && (
                                <div className="math-code">
                                    f(t) = f₀ · r^(t/T) &nbsp;|&nbsp; r = f₁ / f₀ <br />
                                    x(t) = A · sin(2π ∫ f(τ)dτ) · w(t)
                                </div>
                            )}
                            {selectedType === 'phase' && (
                                <div className="math-code">
                                    Barker-13 Code: [1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1] <br />
                                    x(t) = A · sin(2π·f_c·t + θ_n) · w(t)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">CALCULATED WAVEFORM METRICS</div>
                        <div className="data-row"><span>Center Frequency (fc):</span> <span className="cyan">{centerFreq.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Bandwidth (BW):</span> <span>{bandwidth.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Time-Bandwidth Product (T·BW):</span> <span className="green">{(duration * bandwidth).toFixed(1)}</span></div>
                        <div className="data-row"><span>Window Sidelobe Rejection:</span> <span>{windowFunc === 'blackman' ? '-58 dB' : (windowFunc === 'hamming' ? '-41 dB' : '-13 dB')}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
