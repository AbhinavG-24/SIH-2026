/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 10 — Power & Battery
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function PowerBattery() {
    const { latestFrame, env, setStrategy, strategy } = useSonar();

    if (!latestFrame) return <div>Loading Power & Battery Metrics...</div>;

    const { metrics } = latestFrame;

    const powerModes = [
        { id: 'Balanced', label: '⚡ HIGH RESOLUTION', power: 'High (~6.8 W)', desc: 'Full amplitude & maximum bandwidth' },
        { id: 'Balanced', label: '⚖️ BALANCED', power: 'Medium (~4.2 W)', desc: 'Adaptive power scaling for mission endurance' },
        { id: 'Range Priority', label: '🎯 LONG RANGE', power: 'Medium-High (~5.5 W)', desc: 'Concentrated acoustic energy pulses' },
        { id: 'Energy Saving', label: '🔋 LOW POWER ECO', power: 'Low (~1.8 W)', desc: 'Duty-cycled minimal pulse transmission' }
    ];

    return (
        <div className="screen-content power-battery">
            {/* Top Cards Grid */}
            <div className="metrics-summary-grid">
                <div className="card metric-card">
                    <div className="card-label">BATTERY LEVEL</div>
                    <div className="card-val amber">{env.battery} %</div>
                    <div className="card-sub">LiPo 4S (14.8V)</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">ESTIMATED RUNTIME</div>
                    <div className="card-val green">~{metrics.batteryTimeHours} hrs</div>
                    <div className="card-sub">Continuous Ping</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">AVG POWER</div>
                    <div className="card-val cyan">{metrics.avgPowerW.toFixed(2)} W</div>
                    <div className="card-sub">Pushed to Transducer</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">CURRENT DRAW</div>
                    <div className="card-val">{metrics.currentMa.toFixed(0)} mA</div>
                    <div className="card-sub">Peak: {(metrics.currentMa * 1.3).toFixed(0)} mA</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">PULSE ENERGY</div>
                    <div className="card-val">{metrics.pulseEnergyMj.toFixed(3)} mJ</div>
                    <div className="card-sub">Per Acoustic Ping</div>
                </div>
                <div className="card metric-card">
                    <div className="card-label">POWER MODE</div>
                    <div className="card-val green">{metrics.powerMode}</div>
                    <div className="card-sub">Battery-Aware</div>
                </div>
            </div>

            <div className="grid-2-col" style={{ marginTop: '12px' }}>
                {/* Left: CPU vs DMA Benchmark */}
                <div className="card">
                    <div className="card-header">BENCHMARK: CPU-DRIVEN vs DMA-DRIVEN TRANSMISSION</div>
                    
                    <div className="benchmark-comparison-box">
                        <div className="bench-row">
                            <div className="bench-label">
                                <span>CPU-DRIVEN SAMPLE POLLING</span>
                                <span className="danger">68.2% CPU LOAD</span>
                            </div>
                            <div className="score-bar-track">
                                <div className="score-bar-fill danger" style={{ width: '68%' }}></div>
                            </div>
                            <div className="bench-sub">High power drain, interrupt jitter, reduced battery life</div>
                        </div>

                        <div className="bench-row" style={{ marginTop: '16px' }}>
                            <div className="bench-label">
                                <span>DMA + TIMER HARDWARE STREAM (ASIE)</span>
                                <span className="green">12.4% CPU LOAD</span>
                            </div>
                            <div className="score-bar-track">
                                <div className="score-bar-fill winner" style={{ width: '12%' }}></div>
                            </div>
                            <div className="bench-sub">Zero CPU intervention during transmit, 82% power reduction</div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="card-header">ENERGY EFFICIENCY SUMMARY</div>
                    <div className="data-row"><span>Energy Savings Factor:</span> <span className="green">5.5x Efficiency Gain</span></div>
                    <div className="data-row"><span>CPU Overhead Reduction:</span> <span className="cyan">55.8% CPU Freed for Navigation</span></div>
                </div>

                {/* Right: Operating Power Modes */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">POWER MODE SELECTOR</div>
                        <div className="power-mode-list">
                            {powerModes.map((pm, idx) => (
                                <div key={idx} className="power-mode-card" onClick={() => setStrategy(pm.id)}>
                                    <div className="pm-header">
                                        <span className="pm-title">{pm.label}</span>
                                        <span className="pm-watt">{pm.power}</span>
                                    </div>
                                    <div className="pm-desc">{pm.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">BATTERY HEALTH SPECS</div>
                        <div className="data-row"><span>Pack Configuration:</span> <span>4S1P Li-Ion (14.8V Nominal)</span></div>
                        <div className="data-row"><span>Capacity:</span> <span>5200 mAh (76.9 Wh)</span></div>
                        <div className="data-row"><span>Low Battery Threshold:</span> <span className="amber">20 % (Auto Eco Switch)</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
