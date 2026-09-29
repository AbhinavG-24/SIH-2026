/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 9 — FSM / Embedded Status
 */

import React, { useState } from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function FsmEmbeddedStatus() {
    const { fsmState, latestFrame, isRunning } = useSonar();
    const [selectedStateNode, setSelectedStateNode] = useState('TRANSMIT');

    const fsmNodes = [
        { id: 'BOOT', label: '1. BOOT', desc: 'Microcontroller power-on initialization & register setup', status: 'COMPLETED' },
        { id: 'SELF_TEST', label: '2. SELF TEST', desc: 'Hardware peripheral diagnostic check (ADC, DAC, DMA, Timers)', status: 'COMPLETED' },
        { id: 'IDLE', label: '3. IDLE', desc: 'Standby mode awaiting environmental trigger or pulse timer', status: 'READY' },
        { id: 'SENSE', label: '4. READ ENV', desc: 'ADC sampling of Turbidity, Depth, Temp & Salinity sensors', status: 'ACTIVE' },
        { id: 'CLASSIFY', label: '5. CLASSIFY', desc: 'Environment score computation & classification', status: 'ACTIVE' },
        { id: 'OPTIMIZE', label: '6. ADAPT', desc: 'DSP wave parameter optimization & strategy selection', status: 'ACTIVE' },
        { id: 'GENERATE', label: '7. GENERATE', desc: 'Synthesis of LFM/Geometric/Phase-coded waveform buffer', status: 'ACTIVE' },
        { id: 'WINDOW', label: '8. WINDOW', desc: 'Application of Hamming/Hann/Blackman windowing array', status: 'ACTIVE' },
        { id: 'TRANSMIT', label: '9. DMA+DAC', desc: 'Circular DMA buffer streaming to 12-bit DAC output', status: 'RUNNING' },
        { id: 'MEASURE', label: '10. MEASURE', desc: 'Acoustic transducer feedback sampling & FFT calculation', status: 'RUNNING' },
        { id: 'EVALUATE', label: '11. EVALUATE', desc: 'Signal quality check (SNR, frequency error & sidelobe level)', status: 'RUNNING' }
    ];

    const activeNodeData = fsmNodes.find(n => n.id === selectedStateNode) || fsmNodes[8];
    const metrics = latestFrame ? latestFrame.metrics : { cpuLoad: 17.6, dmaActive: true, bufferSize: 1024 };

    return (
        <div className="screen-content fsm-embedded-status">
            {/* Interactive FSM State Graph */}
            <div className="card fsm-graph-card">
                <div className="card-header">EMBEDDED FINITE STATE MACHINE (FSM) GRAPH</div>
                <div className="fsm-graph-grid">
                    {fsmNodes.map((node) => (
                        <div
                            key={node.id}
                            className={`fsm-graph-node ${fsmState === node.id ? 'glowing' : ''} ${selectedStateNode === node.id ? 'selected' : ''}`}
                            onClick={() => setSelectedStateNode(node.id)}
                        >
                            <div className="node-icon">{fsmState === node.id ? '⚡' : '⚙️'}</div>
                            <div className="node-title">{node.label}</div>
                            <div className="node-status">{fsmState === node.id ? 'ACTIVE NOW' : 'READY'}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid-2-col" style={{ marginTop: '12px' }}>
                {/* Left: Node Details */}
                <div className="card">
                    <div className="card-header">STATE NODE INSPECTOR: {activeNodeData.label}</div>
                    <div className="data-row"><span>State Identifier:</span> <span className="cyan">{activeNodeData.id}</span></div>
                    <div className="data-row"><span>Purpose / Function:</span> <span>{activeNodeData.desc}</span></div>
                    <div className="data-row"><span>Current FSM State:</span> <span className="green">{fsmState}</span></div>
                    <div className="data-row"><span>Target Microcontroller:</span> <span>STM32F4 / ARM Cortex-M4 @ 168MHz</span></div>

                    <div className="divider"></div>

                    <div className="card-header">REGISTER & HARDWARE PERIPHERALS</div>
                    <div className="data-row"><span>DAC Register:</span> <span>DAC_DHR12R1 (12-bit Right Aligned)</span></div>
                    <div className="data-row"><span>DMA Stream:</span> <span>DMA1_Stream5_Channel7 (Circular)</span></div>
                    <div className="data-row"><span>Hardware Timer:</span> <span>TIM2_TRGO @ 200.0 kHz</span></div>
                    <div className="data-row"><span>ADC Register:</span> <span>ADC1_DR (Regular Sequence)</span></div>
                </div>

                {/* Right: Embedded Performance */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">EMBEDDED PERFORMANCE METRICS</div>
                        <div className="data-row"><span>CPU Load:</span> <span className="cyan">{metrics.cpuLoad.toFixed(1)} %</span></div>
                        <div className="data-row"><span>DMA Controller:</span> <span className="green">ACTIVE (Zero-Copy)</span></div>
                        <div className="data-row"><span>DMA Buffer Length:</span> <span>{metrics.bufferSize} Samples</span></div>
                        <div className="data-row"><span>Interrupt Latency:</span> <span>&lt; 1.2 µs</span></div>
                        <div className="data-row"><span>RAM Footprint:</span> <span>14.2 KB / 192 KB</span></div>
                        <div className="data-row"><span>Flash Execution:</span> <span>CoreMark Score 512</span></div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">FSM SAFETY & FAULT TRAPS</div>
                        <div className="data-row"><span>Watchdog Timer (IWDG):</span> <span className="green">ENABLED (250ms)</span></div>
                        <div className="data-row"><span>Brown-Out Reset (BOR):</span> <span className="green">ACTIVE (2.7V Threshold)</span></div>
                        <div className="data-row"><span>Over-Current Trap:</span> <span className="green">NOMINAL</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
