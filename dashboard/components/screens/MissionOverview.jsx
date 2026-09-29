/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 1 — Mission Overview
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';
import { CanvasVisualizer } from '../common/CanvasVisualizer.jsx';

export function MissionOverview() {
    const { latestFrame, env, isRunning } = useSonar();

    if (!latestFrame) {
        return <div className="loading-state">Initializing Sonar Engine...</div>;
    }

    const { params, metrics, loopInfo, digitalTwin } = latestFrame;

    return (
        <div className="screen-content mission-overview">
            {/* Top Status Cards */}
            <div className="metrics-summary-grid">
                <div className="card metric-card">
                    <div className="card-label">ENVIRONMENT</div>
                    <div className="card-val" style={{ color: params.envColor }}>{params.envClass}</div>
                    <div className="card-sub">Score: {params.envScore.toFixed(3)}</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">TRANSMITTER</div>
                    <div className="card-val green">{isRunning ? 'ACTIVE' : 'READY'}</div>
                    <div className="card-sub">Mode: {params.mode.toUpperCase()}</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">WAVEFORM</div>
                    <div className="card-val cyan">{params.mode === 'lfm' ? 'LFM CHIRP' : (params.mode === 'geometric' ? 'GEO SWEEP' : 'PHASE CODED')}</div>
                    <div className="card-sub">Win: {params.window.toUpperCase()}</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">CENTER FREQ</div>
                    <div className="card-val">{params.fc.toFixed(1)} kHz</div>
                    <div className="card-sub">Span: {params.f0.toFixed(1)} - {params.f1.toFixed(1)} kHz</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">BANDWIDTH</div>
                    <div className="card-val">{params.bw.toFixed(1)} kHz</div>
                    <div className="card-sub">Res: ~{(1500 / (2 * params.bw * 1000) * 100).toFixed(1)} cm</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">BATTERY</div>
                    <div className="card-val amber">{env.battery}%</div>
                    <div className="card-sub">Est: ~{metrics.batteryTimeHours} hrs</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">CPU LOAD</div>
                    <div className="card-val">{metrics.cpuLoad.toFixed(1)}%</div>
                    <div className="card-sub">DMA-Driven</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">DMA STATUS</div>
                    <div className="card-val green">{metrics.dmaActive ? 'ACTIVE' : 'IDLE'}</div>
                    <div className="card-sub">Buf: {metrics.bufferSize} B</div>
                </div>
            </div>

            {/* Main Center + Side Panel */}
            <div className="grid-2-col">
                <div className="left-column">
                    <div className="card viz-card">
                        <div className="card-header">
                            <span>LIVE SONAR TRANSMISSION WAVEFORM</span>
                            <span className="badge-tag">REAL-TIME DSP</span>
                        </div>
                        <CanvasVisualizer type="waveform" frame={latestFrame} height={240} />
                    </div>

                    <div className="grid-2-col" style={{ marginTop: '12px' }}>
                        <div className="card">
                            <div className="card-header">ENVIRONMENTAL SUMMARY</div>
                            <div className="data-row"><span>Turbidity:</span> <span>{env.turbidity}%</span></div>
                            <div className="data-row"><span>Depth:</span> <span>{env.depth} m</span></div>
                            <div className="data-row"><span>Temperature:</span> <span>{env.temperature} °C</span></div>
                            <div className="data-row"><span>Salinity:</span> <span>{env.salinity} PSU</span></div>
                            <div className="divider"></div>
                            <div className="data-row"><span>Classification:</span> <span style={{ color: params.envColor, fontWeight: 'bold' }}>{params.envClass}</span></div>
                            <div className="data-row"><span>Adaptation Confidence:</span> <span className="cyan">{(1 - params.envScore * 0.4).toFixed(3)}</span></div>
                        </div>

                        <div className="card">
                            <div className="card-header">CURRENT TRANSMISSION HUD</div>
                            <div className="data-row"><span>Mode:</span> <span className="cyan">{params.mode.toUpperCase()}</span></div>
                            <div className="data-row"><span>Start Freq:</span> <span>{params.f0.toFixed(1)} kHz</span></div>
                            <div className="data-row"><span>End Freq:</span> <span>{params.f1.toFixed(1)} kHz</span></div>
                            <div className="data-row"><span>Pulse Duration:</span> <span>{params.duration.toFixed(2)} ms</span></div>
                            <div className="data-row"><span>Amplitude:</span> <span>{params.amplitude.toFixed(1)} %</span></div>
                            <div className="data-row"><span>Window Function:</span> <span>{params.window.toUpperCase()}</span></div>
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    <div className="card">
                        <div className="card-header">CLOSED-LOOP ADAPTATION STATUS</div>
                        <div className="closed-loop-box">
                            <div className="loop-iter">Iteration #{loopInfo.iteration}</div>
                            <div className={`loop-res ${loopInfo.result === 'ACCEPTED' ? 'green' : 'amber'}`}>
                                {loopInfo.result}
                            </div>
                            <div className="loop-meta">
                                <div>Total Pulses: <span>{loopInfo.pulseCount}</span></div>
                                <div>Re-optimizations: <span>{loopInfo.reoptCount}</span></div>
                                <div>Estimated SNR: <span>{loopInfo.snr.toFixed(1)} dB</span></div>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="card-header">DIGITAL TWIN SNAPSHOT</div>
                        <div className="data-row"><span>Exp Fc:</span> <span>{digitalTwin.expectedFc.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Meas Fc:</span> <span>{digitalTwin.measuredFc.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Fc Error:</span> <span className="amber">{digitalTwin.fcError.toFixed(2)}%</span></div>
                        <div className="data-row"><span>Exp BW:</span> <span>{digitalTwin.expectedBw.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Meas BW:</span> <span>{digitalTwin.measuredBw.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Twin Status:</span> <span className="green">{digitalTwin.status}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
