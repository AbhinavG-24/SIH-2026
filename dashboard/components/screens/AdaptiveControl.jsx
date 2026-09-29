/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 3 — Adaptive Control
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function AdaptiveControl() {
    const { latestFrame, env, strategy, setStrategy } = useSonar();

    if (!latestFrame) return <div>Loading...</div>;

    const { params } = latestFrame;

    const strategies = [
        { id: 'Balanced', label: '⚖️ BALANCED', desc: 'Optimal trade-off between propagation range and spatial resolution' },
        { id: 'Resolution Priority', label: '🔬 RESOLUTION PRIORITY', desc: 'Wider bandwidth & shorter pulse duration for detailed target imaging' },
        { id: 'Range Priority', label: '🎯 RANGE PRIORITY', desc: 'Lower center frequency & longer pulse for long-range penetration' },
        { id: 'Energy Saving', label: '🔋 ENERGY SAVING', desc: 'Reduced pulse amplitude & duty cycle to conserve AUV battery' }
    ];

    // Dynamic "WHY THIS CONFIGURATION?" explanation
    const getRationale = () => {
        const reasons = [];
        if (env.turbidity > 60) {
            reasons.push(`High turbidity (${env.turbidity}%) increases acoustic scattering. Lower center frequency (${params.fc.toFixed(1)} kHz) minimizes volumetric attenuation.`);
        } else {
            reasons.push(`Low turbidity (${env.turbidity}%) allows higher operating frequency (${params.fc.toFixed(1)} kHz) for crisp spatial imaging.`);
        }

        if (env.depth > 60) {
            reasons.push(`Deep water operation (${env.depth} m) requires extended pulse duration (${params.duration.toFixed(2)} ms) to maintain adequate Signal-to-Noise Ratio (SNR).`);
        }

        if (env.battery < 30) {
            reasons.push(`Battery state is low (${env.battery}%). Power limiting has scaled transmit amplitude to ${params.amplitude.toFixed(1)}%.`);
        }

        reasons.push(`Selected strategy '${strategy.toUpperCase()}' adjusted bandwidth to ${params.bw.toFixed(1)} kHz with a ${params.window.toUpperCase()} window to suppress spectral sidelobes.`);

        return reasons.join(' ');
    };

    return (
        <div className="screen-content adaptive-control">
            {/* Pipeline Visual Block Diagram */}
            <div className="card pipeline-card">
                <div className="card-header">CLOSED-LOOP ADAPTATION PIPELINE</div>
                <div className="pipeline-flow-diagram">
                    <div className="pipe-node">
                        <div className="pipe-title">ENVIRONMENT SENSING</div>
                        <div className="pipe-sub">Turbidity: {env.turbidity}% | Depth: {env.depth}m</div>
                    </div>
                    <div className="pipe-arrow">➔</div>
                    <div className="pipe-node">
                        <div className="pipe-title">CLASSIFIER SCORE</div>
                        <div className="pipe-sub">E = {params.envScore.toFixed(3)} [{params.envClass}]</div>
                    </div>
                    <div className="pipe-arrow">➔</div>
                    <div className="pipe-node highlight">
                        <div className="pipe-title">ADAPTATION ENGINE</div>
                        <div className="pipe-sub">Strategy: {strategy}</div>
                    </div>
                    <div className="pipe-arrow">➔</div>
                    <div className="pipe-node active">
                        <div className="pipe-title">OPTIMIZED WAVEFORM</div>
                        <div className="pipe-sub">{params.mode.toUpperCase()} @ {params.fc.toFixed(1)} kHz</div>
                    </div>
                </div>
            </div>

            <div className="grid-2-col" style={{ marginTop: '12px' }}>
                {/* Left: Strategy Selector */}
                <div className="card">
                    <div className="card-header">OPERATING STRATEGY SELECTION</div>
                    <div className="strategy-grid">
                        {strategies.map(s => (
                            <button
                                key={s.id}
                                className={`strategy-card-btn ${strategy === s.id ? 'active' : ''}`}
                                onClick={() => setStrategy(s.id)}
                            >
                                <div className="strat-title">{s.label}</div>
                                <div className="strat-desc">{s.desc}</div>
                            </button>
                        ))}
                    </div>

                    <div className="divider"></div>

                    <div className="card-header">ENVIRONMENTAL CONTRIBUTION BREAKDOWN</div>
                    <div className="data-row"><span>Turbidity Weight (35%):</span> <span>{(env.turbidity * 0.35).toFixed(1)} pts</span></div>
                    <div className="data-row"><span>Depth Weight (30%):</span> <span>{(env.depth * 0.30).toFixed(1)} pts</span></div>
                    <div className="data-row"><span>Salinity Weight (15%):</span> <span>{(env.salinity / 45 * 15).toFixed(1)} pts</span></div>
                    <div className="data-row"><span>Temperature Weight (10%):</span> <span>{((50 - env.temperature) / 50 * 10).toFixed(1)} pts</span></div>
                    <div className="data-row"><span>Battery Reserve Weight (10%):</span> <span>{((100 - env.battery) / 100 * 10).toFixed(1)} pts</span></div>
                </div>

                {/* Right: Rationale & Computed Params */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">WHY THIS CONFIGURATION?</div>
                        <div className="rationale-box">
                            <div className="rationale-icon">💡</div>
                            <div className="rationale-text">{getRationale()}</div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">COMPUTED TRANSMISSION PARAMETERS</div>
                        <div className="data-row"><span>Waveform Mode:</span> <span className="cyan">{params.mode.toUpperCase()}</span></div>
                        <div className="data-row"><span>Center Frequency (fc):</span> <span className="green">{params.fc.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Bandwidth (BW):</span> <span>{params.bw.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Start Freq (f0):</span> <span>{params.f0.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>End Freq (f1):</span> <span>{params.f1.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Pulse Duration (T):</span> <span>{params.duration.toFixed(2)} ms</span></div>
                        <div className="data-row"><span>Signal Amplitude (A):</span> <span>{params.amplitude.toFixed(1)} %</span></div>
                        <div className="data-row"><span>Window Taper:</span> <span>{params.window.toUpperCase()}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
