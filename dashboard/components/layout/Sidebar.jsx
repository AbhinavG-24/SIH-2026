/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Sidebar Component (Sidebar.jsx)
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function Sidebar() {
    const { activeScreen, setActiveScreen, isRunning, hardwareMode, waveformMode } = useSonar();

    const navItems = [
        { id: 'mission', label: 'Mission Overview', icon: '📡' },
        { id: 'environment', label: 'Environment & Sensing', icon: '🌊' },
        { id: 'control', label: 'Adaptive Control', icon: '⚡' },
        { id: 'lab', label: 'Waveform Lab', icon: '🔬' },
        { id: 'transmission', label: 'Live Transmission', icon: '▶' },
        { id: 'analysis', label: 'Signal Analysis', icon: '📊' },
        { id: 'optimizer', label: 'Auto Optimizer', icon: '🎯' },
        { id: 'twin', label: 'Digital Twin', icon: '👥' },
        { id: 'fsm', label: 'FSM / Embedded Status', icon: '🔄' },
        { id: 'power', label: 'Power & Battery', icon: '🔋' },
        { id: 'logs', label: 'Data Logs', icon: '📋' },
        { id: 'health', label: 'System Health', icon: '🛡️' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    return (
        <aside className="asie-sidebar">
            <div className="sidebar-brand">
                <div className="brand-logo">⚡ ASIE</div>
                <div className="brand-title">Adaptive Sonar</div>
                <div className="brand-subtitle">Intelligence Engine</div>
                <div className="brand-badge">AUV TRANSDUCER V2.4</div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
                        onClick={() => setActiveScreen(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-status-footer">
                <div className="status-footer-header">SYSTEM STATUS</div>
                <div className="status-line">
                    <span className={`status-dot ${isRunning ? 'active' : ''}`}></span>
                    <span className="status-text">TRANSMITTER {isRunning ? 'ACTIVE' : 'READY'}</span>
                </div>
                <div className="status-line">
                    <span className="status-dot green"></span>
                    <span className="status-text">ADC CONNECTED</span>
                </div>
                <div className="status-line">
                    <span className="status-dot green"></span>
                    <span className="status-text">DAC CONNECTED</span>
                </div>
                <div className="status-line">
                    <span className="status-dot green"></span>
                    <span className="status-text">DMA ACTIVE</span>
                </div>
                
                <div className="status-meta-grid">
                    <div>
                        <div className="meta-label">Connection</div>
                        <div className="meta-val green">ONLINE</div>
                    </div>
                    <div>
                        <div className="meta-label">Mode</div>
                        <div className="meta-val cyan">{waveformMode === 'auto' ? 'ADAPTIVE' : 'MANUAL'}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
