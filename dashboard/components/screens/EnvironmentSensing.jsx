/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 2 — Environment & Sensing
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function EnvironmentSensing() {
    const { env, updateEnv, activePreset, applyPreset, latestFrame } = useSonar();

    const presets = [
        { id: 'clear', label: '🌊 CLEAR SHALLOW', desc: 'Low turbidity, shallow depth -> High resolution high freq mode' },
        { id: 'moderate', label: '🌤 MODERATE', desc: 'Standard coastal waters -> Balanced range & resolution' },
        { id: 'murky', label: '🟤 MURKY', desc: 'High particulate matter -> Extended pulse duration' },
        { id: 'deepMurky', label: '🔴 DEEP MURKY', desc: 'High depth & turbidity -> Low freq penetration mode' },
        { id: 'lowBattery', label: '🔋 LOW BATTERY', desc: 'Critical battery reserve -> Power saving reduced power' },
        { id: 'turbulent', label: '🌪 TURBULENT', desc: 'Surface bubbles & turbulence -> Phase coded noise rejection' }
    ];

    const params = latestFrame ? latestFrame.params : { envScore: 0.45, envClass: 'MODERATE', envColor: '#00a8ff' };

    return (
        <div className="screen-content environment-sensing">
            <div className="grid-2-col">
                {/* Sliders Panel */}
                <div className="card">
                    <div className="card-header">ENVIRONMENTAL PARAMETER CONTROLS</div>
                    
                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Turbidity (Suspended Solids)</span>
                            <span className="slider-val">{env.turbidity} %</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={env.turbidity} 
                            onChange={(e) => updateEnv({ turbidity: parseInt(e.target.value) })} 
                        />
                        <div className="slider-meta"><span>0% (Crystal Clear)</span><span>100% (Dense Silt)</span></div>
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Water Depth</span>
                            <span className="slider-val">{env.depth} m</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={env.depth} 
                            onChange={(e) => updateEnv({ depth: parseInt(e.target.value) })} 
                        />
                        <div className="slider-meta"><span>0 m (Surface)</span><span>100 m (Deep Trench)</span></div>
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Water Temperature</span>
                            <span className="slider-val">{env.temperature} °C</span>
                        </div>
                        <input 
                            type="range" min="0" max="50" value={env.temperature} 
                            onChange={(e) => updateEnv({ temperature: parseInt(e.target.value) })} 
                        />
                        <div className="slider-meta"><span>0 °C (Arctic)</span><span>50 °C (Tropical)</span></div>
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>Salinity</span>
                            <span className="slider-val">{env.salinity} PSU</span>
                        </div>
                        <input 
                            type="range" min="0" max="45" value={env.salinity} 
                            onChange={(e) => updateEnv({ salinity: parseInt(e.target.value) })} 
                        />
                        <div className="slider-meta"><span>0 PSU (Freshwater)</span><span>45 PSU (High Salinity)</span></div>
                    </div>

                    <div className="control-slider-group">
                        <div className="slider-header">
                            <span>AUV Battery Reserve</span>
                            <span className="slider-val amber">{env.battery} %</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={env.battery} 
                            onChange={(e) => updateEnv({ battery: parseInt(e.target.value) })} 
                        />
                        <div className="slider-meta"><span>0% (Empty)</span><span>100% (Full)</span></div>
                    </div>
                </div>

                {/* Presets & Score Panel */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">ENVIRONMENT QUICK PRESETS</div>
                        <div className="presets-list">
                            {presets.map(p => (
                                <button
                                    key={p.id}
                                    className={`preset-card-btn ${activePreset === p.id ? 'active' : ''}`}
                                    onClick={() => applyPreset(p.id)}
                                >
                                    <div className="preset-name">{p.label}</div>
                                    <div className="preset-desc">{p.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">ENVIRONMENTAL CLASSIFICATION SCORE</div>
                        <div className="env-class-banner" style={{ borderColor: params.envColor, color: params.envColor }}>
                            {params.envClass}
                        </div>
                        <div className="data-row"><span>Environmental Score (E):</span> <span className="cyan">{params.envScore.toFixed(3)}</span></div>
                        <div className="data-row"><span>Acoustic Attenuation (α):</span> <span>{(0.02 + params.envScore * 0.12).toFixed(3)} dB/m</span></div>
                        <div className="data-row"><span>Estimated Speed of Sound (c):</span> <span>{(1449 + 4.6 * env.temperature + 1.34 * (env.salinity - 35) + 0.016 * env.depth).toFixed(1)} m/s</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
