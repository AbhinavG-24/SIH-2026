/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 5 — Live Transmission Console
 */

import React, { useState } from 'react';
import { useSonar } from '../../context/SonarContext.jsx';
import { CanvasVisualizer } from '../common/CanvasVisualizer.jsx';

export function LiveTransmission() {
    const { isRunning, toggleTransmission, latestFrame, fsmState, triggerFault } = useSonar();
    const [showStopModal, setShowStopModal] = useState(false);

    if (!latestFrame) return <div>Initializing Transmission Console...</div>;

    const { params, metrics } = latestFrame;

    const pipelineSteps = [
        { id: 'SENSE', label: 'SENSE' },
        { id: 'CLASSIFY', label: 'CLASSIFY' },
        { id: 'OPTIMIZE', label: 'ADAPT' },
        { id: 'GENERATE', label: 'GENERATE' },
        { id: 'WINDOW', label: 'WINDOW' },
        { id: 'TRANSMIT', label: 'DMA/DAC' },
        { id: 'MEASURE', label: 'TRANSMIT' },
        { id: 'EVALUATE', label: 'VALIDATE' }
    ];

    const confirmEmergencyStop = () => {
        toggleTransmission();
        setShowStopModal(false);
    };

    return (
        <div className="screen-content live-transmission">
            {/* Header Control Banner */}
            <div className="card console-banner">
                <div className="console-status-group">
                    <div className={`console-pulse-dot ${isRunning ? 'active' : ''}`}></div>
                    <div className="console-status-text">
                        <span className="label">TRANSMISSION STATUS:</span>
                        <span className={`val ${isRunning ? 'green' : 'amber'}`}>
                            {isRunning ? '● TRANSMITTING ACTIVE' : '○ STANDBY MODE'}
                        </span>
                    </div>
                </div>

                <div className="console-actions">
                    <button className={`btn-primary ${isRunning ? 'active' : ''}`} onClick={toggleTransmission}>
                        {isRunning ? '⏸ PAUSE' : '▶ START TRANSMISSION'}
                    </button>
                    <button className="btn-danger" onClick={() => setShowStopModal(true)}>
                        🚨 EMERGENCY STOP
                    </button>
                </div>
            </div>

            {/* Pipeline Step Flow */}
            <div className="card step-flow-card" style={{ marginTop: '12px' }}>
                <div className="card-header">HARDWARE TRANSMISSION TIMELINE</div>
                <div className="pipeline-timeline">
                    {pipelineSteps.map(step => (
                        <div key={step.id} className={`timeline-step ${fsmState === step.id ? 'active' : ''}`}>
                            <div className="step-circle">{fsmState === step.id ? '⚡' : '✓'}</div>
                            <div className="step-label">{step.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Large Waveform Canvas + Telemetry HUD */}
            <div className="grid-2-col" style={{ marginTop: '12px' }}>
                <div className="card">
                    <div className="card-header">TRANSMITTED SIGNAL OSCILLOGRAM</div>
                    <CanvasVisualizer type="waveform" frame={latestFrame} height={260} />
                </div>

                <div className="right-column">
                    <div className="card">
                        <div className="card-header">EMBEDDED HARDWARE SUBSYSTEMS</div>
                        <div className="hardware-grid">
                            <div className="hw-box ok">
                                <div className="hw-name">DAC (STM32)</div>
                                <div className="hw-status green">OK / ACTIVE</div>
                                <div className="hw-meta">12-bit DMA Stream</div>
                            </div>
                            <div className="hw-box ok">
                                <div className="hw-name">ADC SENSOR</div>
                                <div className="hw-status green">OK / ACTIVE</div>
                                <div className="hw-meta">200 kSPS Sampling</div>
                            </div>
                            <div className="hw-box ok">
                                <div className="hw-name">DMA CONTROLLER</div>
                                <div className="hw-status green">OK / ACTIVE</div>
                                <div className="hw-meta">Circular Buffer</div>
                            </div>
                            <div className="hw-box ok">
                                <div className="hw-name">HARDWARE TIMER</div>
                                <div className="hw-status green">OK / ACTIVE</div>
                                <div className="hw-meta">TIM2 Trigger Sync</div>
                            </div>
                            <div className="hw-box ok">
                                <div className="hw-name">POWER AMPLIFIER</div>
                                <div className="hw-status green">OK / NOMINAL</div>
                                <div className="hw-meta">Impedance Matched</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">TRANSMISSION HUD PARAMETERS</div>
                        <div className="data-row"><span>Center Frequency:</span> <span className="cyan">{params.fc.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Bandwidth:</span> <span>{params.bw.toFixed(1)} kHz</span></div>
                        <div className="data-row"><span>Pulse Duration:</span> <span>{params.duration.toFixed(2)} ms</span></div>
                        <div className="data-row"><span>Signal Power:</span> <span>{params.amplitude.toFixed(1)} %</span></div>
                        <div className="data-row"><span>Selected Waveform:</span> <span className="green">{params.mode.toUpperCase()}</span></div>
                        <div className="data-row"><span>Tapering Window:</span> <span>{params.window.toUpperCase()}</span></div>
                    </div>
                </div>
            </div>

            {/* Emergency Stop Modal */}
            {showStopModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header warning">⚠️ EMERGENCY TRANSMISSION STOP</div>
                        <div className="modal-body">
                            Are you sure you want to immediately shut down acoustic transmission output? 
                            This will halt the hardware DMA stream and trigger safety pin pull-down.
                        </div>
                        <div className="modal-footer">
                            <button className="btn-danger" onClick={confirmEmergencyStop}>CONFIRM STOP</button>
                            <button className="btn-secondary" onClick={() => setShowStopModal(false)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
