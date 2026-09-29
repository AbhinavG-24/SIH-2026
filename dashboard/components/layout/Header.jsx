/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Header Component (Header.jsx)
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function Header() {
    const { 
        activeScreen, 
        isRunning, toggleTransmission, 
        voiceEnabled, toggleVoice, 
        runSelfTest, selfTestRunning,
        fsmState, activeFault,
        isDemoMode, demoStep, startJudgeDemo
    } = useSonar();

    const FSM_STATES = ['BOOT','SELF_TEST','IDLE','SENSE','CLASSIFY','OPTIMIZE','GENERATE','WINDOW','TRANSMIT','MEASURE','EVALUATE','FAULT'];

    const screenTitles = {
        mission: { title: 'MISSION OVERVIEW', desc: 'Real-time environmental adaptation for low-power software-defined sonar transmission' },
        environment: { title: 'ENVIRONMENT & SENSING', desc: 'Acoustic propagation environmental input controls & quick presets' },
        control: { title: 'ADAPTIVE CONTROL', desc: 'Closed-loop adaptation engine pipeline & strategic parameter selector' },
        lab: { title: 'WAVEFORM LAB', desc: 'Software-defined acoustic waveform engineering & windowing workspace' },
        transmission: { title: 'LIVE TRANSMISSION', desc: 'Embedded DAC/DMA transducer control console & hardware telemetry' },
        analysis: { title: 'SIGNAL ANALYSIS', desc: 'Real-time spectral analysis, Cooley-Tukey FFT & spectrogram analytics' },
        optimizer: { title: 'AUTO OPTIMIZER', desc: 'Multi-objective waveform cost function optimization & candidate scoring' },
        twin: { title: 'DIGITAL TWIN', desc: 'Expected theoretical vs measured embedded output validation matrix' },
        fsm: { title: 'FSM / EMBEDDED STATUS', desc: 'Finite State Machine execution graph & microcontroller register status' },
        power: { title: 'POWER & BATTERY', desc: 'Battery-aware energy monitoring & DMA vs CPU power consumption benchmarking' },
        logs: { title: 'DATA LOGS', desc: 'Historical transmission telemetry logging & CSV export platform' },
        health: { title: 'SYSTEM HEALTH & DIAGNOSTICS', desc: 'Subsystem diagnostic verification matrix & fault injection simulator' },
        settings: { title: 'SETTINGS & CONFIGURATION', desc: 'Hardware mode selection, safety limits & DSP parameters' }
    };

    const currentMeta = screenTitles[activeScreen] || screenTitles.mission;

    return (
        <header className="asie-header">
            <div className="header-left">
                <h1 className="page-title">{currentMeta.title}</h1>
                <p className="page-subtitle">{currentMeta.desc}</p>
            </div>

            <div className="header-center">
                <div className="fsm-flow-ribbon">
                    {FSM_STATES.map(st => (
                        <span 
                            key={st} 
                            className={`fsm-node ${st === fsmState ? 'active' : ''} ${st === 'FAULT' ? 'fault' : ''}`}
                        >
                            {st}
                        </span>
                    ))}
                </div>
            </div>

            <div className="header-right">
                <button 
                    className={`btn-header demo-btn ${isDemoMode ? 'active' : ''}`}
                    onClick={startJudgeDemo}
                    title="Run 60-second automated hackathon demo"
                >
                    {isDemoMode ? `⚡ DEMO STEP ${demoStep}/6` : '⚡ 60s JUDGE DEMO'}
                </button>

                <button 
                    className="btn-header voice-btn"
                    onClick={toggleVoice}
                >
                    {voiceEnabled ? '🔊 VOICE ON' : '🔇 VOICE OFF'}
                </button>

                <button 
                    className={`btn-header test-btn ${selfTestRunning ? 'running' : ''}`}
                    onClick={runSelfTest}
                    disabled={selfTestRunning}
                >
                    {selfTestRunning ? '⏳ TESTING...' : '🔬 SELF TEST'}
                </button>

                <button 
                    className={`btn-header master-btn ${isRunning ? 'active' : ''}`}
                    onClick={toggleTransmission}
                >
                    {isRunning ? '⏹ STOP TRANSMISSION' : '▶ START TRANSMISSION'}
                </button>
            </div>
        </header>
    );
}
