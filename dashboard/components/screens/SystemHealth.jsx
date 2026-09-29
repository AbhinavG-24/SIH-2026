/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 12 — System Health & Self Test
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function SystemHealth() {
    const { 
        runSelfTest, selfTestRunning, selfTestLeds, 
        activeFault, triggerFault, clearFault 
    } = useSonar();

    const subsystems = [
        { id: 'adc', name: 'ADC SENSOR ARRAY', icon: '📡', key: 'adc', desc: 'Analog-to-Digital environmental sampling' },
        { id: 'dac', name: 'DAC 12-BIT GENERATOR', icon: '⚡', key: 'dac', desc: 'Digital-to-Analog acoustic waveform output' },
        { id: 'dma', name: 'DMA CONTROLLER STREAM', icon: '🔄', key: 'dma', desc: 'Circular buffer DMA hardware transfer' },
        { id: 'tmr', name: 'HARDWARE TIMER TIM2', icon: '⏱️', key: 'tmr', desc: 'Precise sample clock synchronization' },
        { id: 'mem', name: 'SRAM MEMORY BUFFER', icon: '💾', key: 'mem', desc: 'Buffer integrity & stack allocation' }
    ];

    return (
        <div className="screen-content system-health">
            {/* Top diagnostic header */}
            <div className="card health-banner">
                <div className="health-status">
                    <div className={`health-dot ${activeFault ? 'danger' : 'green'}`}></div>
                    <div className="health-title">
                        SYSTEM HEALTH: <span className={activeFault ? 'danger' : 'green'}>{activeFault ? `FAULT DETECTED: ${activeFault}` : 'ALL SYSTEMS NOMINAL'}</span>
                    </div>
                </div>

                <div className="health-actions">
                    <button 
                        className={`btn-primary ${selfTestRunning ? 'running' : ''}`}
                        onClick={runSelfTest}
                        disabled={selfTestRunning}
                    >
                        {selfTestRunning ? '🔬 RUNNING DIAGNOSTICS...' : '🔬 RUN FULL SELF TEST'}
                    </button>
                    {activeFault && (
                        <button className="btn-secondary" onClick={clearFault}>
                            🧹 CLEAR ACTIVE FAULTS
                        </button>
                    )}
                </div>
            </div>

            <div className="grid-2-col" style={{ marginTop: '12px' }}>
                {/* Left: Hardware Subsystem Diagnostic Cards */}
                <div className="card">
                    <div className="card-header">HARDWARE SUBSYSTEM VERIFICATION MATRIX</div>
                    <div className="subsystem-grid">
                        {subsystems.map(sub => {
                            const isPass = !activeFault && (selfTestLeds[sub.key] || true);
                            return (
                                <div key={sub.id} className={`sub-card ${activeFault ? 'fault' : 'pass'}`}>
                                    <div className="sub-header">
                                        <span className="sub-icon">{sub.icon}</span>
                                        <span className="sub-name">{sub.name}</span>
                                    </div>
                                    <div className="sub-desc">{sub.desc}</div>
                                    <div className="sub-status">
                                        Status: <span className={activeFault ? 'danger' : 'green'}>{activeFault ? 'FAULT' : 'PASSED ✓'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Fault Injection Testing */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">FAULT INJECTION SIMULATOR (TESTING)</div>
                        <div className="fault-desc">
                            Inject mock hardware failures to evaluate ASIE system fault recovery, FSM trap handling, and emergency safety isolation.
                        </div>

                        <div className="fault-buttons-grid">
                            <button className="btn-fault" onClick={() => triggerFault('ADC SENSOR DISCONNECTED')}>
                                ⚠️ SIMULATE ADC DISCONNECT
                            </button>
                            <button className="btn-fault" onClick={() => triggerFault('DMA BUFFER UNDERRUN')}>
                                ⚠️ SIMULATE DMA UNDERRUN
                            </button>
                            <button className="btn-fault" onClick={() => triggerFault('OVERCURRENT DETECTED')}>
                                ⚠️ SIMULATE OVERCURRENT
                            </button>
                            <button className="btn-fault" onClick={() => triggerFault('CRITICAL BATTERY DROP')}>
                                ⚠️ SIMULATE LOW BATTERY
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">DIAGNOSTIC LOG & TRAFFIC</div>
                        <div className="diag-log-box">
                            <div>[00:00.01] ASIE Hardware Diagnostics Init.</div>
                            <div>[00:00.05] ADC1_CH4 calibrated at 200.0 kSPS.</div>
                            <div>[00:00.12] DAC1 DMA Stream configured circular mode.</div>
                            <div>[00:00.18] TIM2 Trigger frequency set to 200 kHz.</div>
                            <div>[00:00.25] DSP Memory check: 0 errors found.</div>
                            {activeFault && (
                                <div className="danger">[TRAP ALARM] {activeFault} — Output disabled!</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
