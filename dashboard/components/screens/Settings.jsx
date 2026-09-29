/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 13 — Settings & Configuration
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function Settings() {
    const { 
        hardwareMode, setHardwareMode, 
        voiceEnabled, toggleVoice,
        waveformMode, setWaveformMode,
        windowType, setWindowType
    } = useSonar();

    return (
        <div className="screen-content settings-screen">
            <div className="grid-2-col">
                {/* Left: Hardware / Simulation Mode */}
                <div className="card">
                    <div className="card-header">HARDWARE / SIMULATION PROVIDER MODE</div>
                    
                    <div className="mode-toggle-box">
                        <button 
                            className={`mode-select-btn ${hardwareMode === 'SIMULATION' ? 'active' : ''}`}
                            onClick={() => setHardwareMode('SIMULATION')}
                        >
                            <div className="m-title">🎮 SIMULATION DEMO MODE</div>
                            <div className="m-desc">Internal DSP noise model & mathematical environmental simulation (Hackathon Demo Ready)</div>
                        </button>

                        <button 
                            className={`mode-select-btn ${hardwareMode === 'SERIAL' ? 'active' : ''}`}
                            onClick={() => setHardwareMode('SERIAL')}
                        >
                            <div className="m-title">🔌 HARDWARE SERIAL (WEB SERIAL API)</div>
                            <div className="m-desc">Direct USB/UART connection to STM32 microcontroller board</div>
                        </button>

                        <button 
                            className={`mode-select-btn ${hardwareMode === 'WEBSOCKET' ? 'active' : ''}`}
                            onClick={() => setHardwareMode('WEBSOCKET')}
                        >
                            <div className="m-title">🌐 HARDWARE WEBSOCKET BRIDGE</div>
                            <div className="m-desc">Remote IP network stream from embedded Linux / ROS node</div>
                        </button>
                    </div>

                    <div className="divider"></div>

                    <div className="card-header">DSP DEFAULTS</div>
                    <div className="control-group">
                        <label>Default Waveform Mode:</label>
                        <select className="dropdown" value={waveformMode} onChange={(e) => setWaveformMode(e.target.value)}>
                            <option value="auto">AUTO (Optimizer Driven)</option>
                            <option value="lfm">LFM Chirp</option>
                            <option value="geometric">Geometric Sweep</option>
                            <option value="phase">Phase Coded</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Default Window Function:</label>
                        <select className="dropdown" value={windowType} onChange={(e) => setWindowType(e.target.value)}>
                            <option value="hamming">Hamming</option>
                            <option value="hann">Hann</option>
                            <option value="blackman">Blackman</option>
                            <option value="none">None (Rectangular)</option>
                        </select>
                    </div>
                </div>

                {/* Right: Safety Limits & Voice Settings */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">SAFETY & OPERATIONAL LIMITS</div>
                        <div className="data-row"><span>Min Frequency Limit:</span> <span>50.0 kHz</span></div>
                        <div className="data-row"><span>Max Frequency Limit:</span> <span>500.0 kHz</span></div>
                        <div className="data-row"><span>Max Transmit Power Limit:</span> <span>100 % (12 W Peak)</span></div>
                        <div className="data-row"><span>Critical Battery Shutdown:</span> <span className="amber">10 % Reserve</span></div>
                        <div className="data-row"><span>Over-Temperature Threshold:</span> <span className="danger">65.0 °C</span></div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">AUDIO VOICE ASSISTANT CONFIGURATION</div>
                        <div className="data-row"><span>Speech Synthesis:</span> <span>Web Speech API</span></div>
                        <div className="data-row"><span>Voice Status:</span> <span className="cyan">{voiceEnabled ? 'ENABLED' : 'MUTED'}</span></div>
                        <div style={{ marginTop: '12px' }}>
                            <button className="btn-secondary" onClick={toggleVoice}>
                                {voiceEnabled ? '🔇 MUTE VOICE ASSISTANT' : '🔊 ENABLE VOICE ASSISTANT'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
