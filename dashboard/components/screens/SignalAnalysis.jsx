/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 6 — Signal Analysis
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';
import { CanvasVisualizer } from '../common/CanvasVisualizer.jsx';

export function SignalAnalysis() {
    const { latestFrame, hardwareMode } = useSonar();

    if (!latestFrame) return <div>Initializing DSP Signal Analysis...</div>;

    const { dspMetrics, loopInfo, digitalTwin } = latestFrame;
    const isHardware = hardwareMode !== 'SIMULATION';
    const tagLabel = isHardware ? 'MEASURED' : 'SIMULATED';

    const isValid = loopInfo.snr > 18 && digitalTwin.fcError < 5.0;

    return (
        <div className="screen-content signal-analysis">
            {/* Top row: Waveform & Spectrogram */}
            <div className="grid-2-col">
                <div className="card">
                    <div className="card-header">
                        <span>1. TIME-DOMAIN WAVEFORM</span>
                        <span className="badge-tag">{tagLabel}</span>
                    </div>
                    <CanvasVisualizer type="waveform" frame={latestFrame} height={200} />
                </div>

                <div className="card">
                    <div className="card-header">
                        <span>2. REAL-TIME SPECTROGRAM</span>
                        <span className="badge-tag">{tagLabel}</span>
                    </div>
                    <CanvasVisualizer type="spectrogram" frame={latestFrame} height={200} />
                    <div className="spectro-legend">
                        <span className="legend-low">Low Freq / Power</span>
                        <div className="spectro-bar"></div>
                        <span className="legend-high">High Freq / Power</span>
                    </div>
                </div>
            </div>

            {/* Bottom row: FFT & Signal Quality */}
            <div className="grid-2-col" style={{ marginTop: '12px' }}>
                <div className="card">
                    <div className="card-header">
                        <span>3. COOLEY-TUKEY FFT SPECTRUM</span>
                        <span className="badge-tag">{tagLabel}</span>
                    </div>
                    <CanvasVisualizer type="fft" frame={latestFrame} height={190} />
                    <div className="fft-metrics-bar">
                        <div>Peak Freq: <span className="cyan">{dspMetrics.peakFreq.toFixed(1)} kHz</span></div>
                        <div>-3dB Bandwidth: <span className="green">{dspMetrics.bandwidth.toFixed(1)} kHz</span></div>
                        <div>Noise Floor: <span>-74.2 dB</span></div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span>4. SIGNAL QUALITY ANALYZER</span>
                        <span className="badge-tag">CALCULATED</span>
                    </div>
                    
                    <div className="sq-main-badge">
                        <span className="sq-label">SIGNAL VALIDATION:</span>
                        <span className={`sq-val ${isValid ? 'green' : 'danger'}`}>
                            {isValid ? '✓ ACCEPTED / VALID' : '✗ RE-OPTIMIZATION REQUIRED'}
                        </span>
                    </div>

                    <div className="divider"></div>

                    <div className="data-row"><span>Center Frequency Error:</span> <span className="amber">{digitalTwin.fcError.toFixed(2)} %</span></div>
                    <div className="data-row"><span>Bandwidth Error:</span> <span className="amber">{digitalTwin.bwError.toFixed(2)} %</span></div>
                    <div className="data-row"><span>Signal-to-Noise Ratio (SNR):</span> <span className="cyan">{loopInfo.snr.toFixed(1)} dB</span></div>
                    <div className="data-row"><span>Peak Sidelobe Level:</span> <span>{loopInfo.sidelobeDb.toFixed(1)} dB</span></div>
                    <div className="data-row"><span>Total Harmonic Distortion (THD):</span> <span>{dspMetrics.thd.toFixed(2)} %</span></div>

                    <div className="sq-footer-note">
                        Thresholds: SNR &gt; 18.0 dB | Freq Error &lt; 5.0% | Sidelobe &lt; -20 dB
                    </div>
                </div>
            </div>
        </div>
    );
}
