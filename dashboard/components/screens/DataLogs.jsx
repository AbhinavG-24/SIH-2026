/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 11 — Data Logs & Telemetry
 */

import React, { useState } from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function DataLogs() {
    const { logs, exportCSV } = useSonar();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterQuality, setFilterQuality] = useState('ALL');

    const filteredLogs = logs.filter(log => {
        const matchSearch = log.timestamp.includes(searchTerm) || 
                            log.mode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.envClass.toLowerCase().includes(searchTerm.toLowerCase());
        const matchQuality = filterQuality === 'ALL' || log.quality === filterQuality;
        return matchSearch && matchQuality;
    });

    return (
        <div className="screen-content data-logs">
            <div className="card">
                <div className="card-header flex-between">
                    <span>TELEMETRY LOGGING TABLE ({filteredLogs.length} RECORDED PULSES)</span>
                    <div className="log-actions">
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="🔍 Search log entries..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select 
                            className="dropdown inline-dropdown"
                            value={filterQuality}
                            onChange={(e) => setFilterQuality(e.target.value)}
                        >
                            <option value="ALL">Filter: All Results</option>
                            <option value="VALID">Filter: VALID Only</option>
                            <option value="INVALID">Filter: INVALID Only</option>
                        </select>
                        <button className="btn-primary" onClick={exportCSV}>📥 EXPORT CSV</button>
                    </div>
                </div>

                <div className="table-container full-height-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Score (E)</th>
                                <th>Class</th>
                                <th>Turb %</th>
                                <th>Depth m</th>
                                <th>Temp °C</th>
                                <th>Mode</th>
                                <th>Fc (kHz)</th>
                                <th>BW (kHz)</th>
                                <th>Pulse (ms)</th>
                                <th>Amp %</th>
                                <th>Battery</th>
                                <th>Power (W)</th>
                                <th>Quality</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="14" style={{ textAlign: 'center', padding: '20px', color: '#667788' }}>
                                        No logs recorded yet. Start transmission to collect acoustic telemetry data.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.timestamp}</td>
                                        <td>{row.score}</td>
                                        <td><span className="cyan">{row.envClass}</span></td>
                                        <td>{row.turbidity}</td>
                                        <td>{row.depth}</td>
                                        <td>{row.temp}</td>
                                        <td><strong>{row.mode}</strong></td>
                                        <td>{row.fc}</td>
                                        <td>{row.bw}</td>
                                        <td>{row.pulse}</td>
                                        <td>{row.amp}</td>
                                        <td>{row.battery}%</td>
                                        <td>{row.power}</td>
                                        <td>
                                            <span className={`badge-sm ${row.quality === 'VALID' ? 'green' : 'danger'}`}>
                                                {row.quality === 'VALID' ? '✓ VALID' : '✗ REOPT'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
