/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Screen 7 — Auto Optimizer
 */

import React from 'react';
import { useSonar } from '../../context/SonarContext.jsx';

export function AutoOptimizer() {
    const { latestFrame, optimizerWeights, setOptimizerWeights, waveformMode } = useSonar();

    if (!latestFrame) return <div>Loading Auto Optimizer...</div>;

    const { optimizerScores, params } = latestFrame;
    const { w1, w2, w3, w4 } = optimizerWeights;

    const scores = optimizerScores || {
        lfm: { J: 0.32, energy: 0.2, sidelobePenalty: 0.6, resPenalty: 0.3, rangePenalty: 0.2, selected: true },
        geometric: { J: 0.45, energy: 0.2, sidelobePenalty: 0.8, resPenalty: 0.4, rangePenalty: 0.3, selected: false },
        phase: { J: 0.28, energy: 0.3, sidelobePenalty: 0.2, resPenalty: 0.2, rangePenalty: 0.4, selected: false }
    };

    const maxJ = Math.max(scores.lfm.J, scores.geometric.J, scores.phase.J) || 1.0;

    const recommendedMode = scores.lfm.selected ? 'LFM CHIRP' : (scores.geometric.selected ? 'GEOMETRIC SWEEP' : 'PHASE CODED');

    return (
        <div className="screen-content auto-optimizer">
            <div className="grid-2-col">
                {/* Left: Score Comparison */}
                <div className="card">
                    <div className="card-header">CANDIDATE WAVEFORM EVALUATION SCOREBOARD</div>

                    <div className="optimizer-candidate-box">
                        <div className="candidate-header">
                            <span>LFM CHIRP (Linear Frequency Modulation)</span>
                            <span className="cyan">{scores.lfm.J.toFixed(3)}</span>
                        </div>
                        <div className="score-bar-track">
                            <div className={`score-bar-fill ${scores.lfm.selected ? 'winner' : ''}`} style={{ width: `${(scores.lfm.J / maxJ * 100)}%` }}></div>
                        </div>
                        <div className="candidate-sub">
                            Energy: {scores.lfm.energy.toFixed(2)} | Sidelobe: {scores.lfm.sidelobePenalty.toFixed(2)} | Res: {scores.lfm.resPenalty.toFixed(2)} | Range: {scores.lfm.rangePenalty.toFixed(2)}
                        </div>
                    </div>

                    <div className="optimizer-candidate-box">
                        <div className="candidate-header">
                            <span>GEOMETRIC SWEEP (Logarithmic Frequency)</span>
                            <span className="cyan">{scores.geometric.J.toFixed(3)}</span>
                        </div>
                        <div className="score-bar-track">
                            <div className={`score-bar-fill ${scores.geometric.selected ? 'winner' : ''}`} style={{ width: `${(scores.geometric.J / maxJ * 100)}%` }}></div>
                        </div>
                        <div className="candidate-sub">
                            Energy: {scores.geometric.energy.toFixed(2)} | Sidelobe: {scores.geometric.sidelobePenalty.toFixed(2)} | Res: {scores.geometric.resPenalty.toFixed(2)} | Range: {scores.geometric.rangePenalty.toFixed(2)}
                        </div>
                    </div>

                    <div className="optimizer-candidate-box">
                        <div className="candidate-header">
                            <span>PHASE-CODED (Barker-13 Sequence)</span>
                            <span className="cyan">{scores.phase.J.toFixed(3)}</span>
                        </div>
                        <div className="score-bar-track">
                            <div className={`score-bar-fill ${scores.phase.selected ? 'winner' : ''}`} style={{ width: `${(scores.phase.J / maxJ * 100)}%` }}></div>
                        </div>
                        <div className="candidate-sub">
                            Energy: {scores.phase.energy.toFixed(2)} | Sidelobe: {scores.phase.sidelobePenalty.toFixed(2)} | Res: {scores.phase.resPenalty.toFixed(2)} | Range: {scores.phase.rangePenalty.toFixed(2)}
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="recommendation-card">
                        <div className="rec-header">RECOMMENDED WAVEFORM</div>
                        <div className="rec-title green">{recommendedMode}</div>
                        <div className="rec-desc">
                            Selected automatically based on current environmental attenuation, sidelobe rejection priority, and minimum total cost index J = {Math.min(scores.lfm.J, scores.geometric.J, scores.phase.J).toFixed(3)}.
                        </div>
                    </div>
                </div>

                {/* Right: Cost Function Weight Sliders */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">COST FUNCTION WEIGHT TUNING</div>
                        <div className="cost-formula-box">
                            J = w₁·Energy + w₂·SidelobePenalty + w₃·ResPenalty + w₄·RangePenalty
                        </div>

                        <div className="control-slider-group">
                            <div className="slider-header">
                                <span>w₁: Pulse Energy Weight</span>
                                <span className="slider-val">{w1.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={w1} 
                                onChange={(e) => setOptimizerWeights({ ...optimizerWeights, w1: parseFloat(e.target.value) })} 
                            />
                        </div>

                        <div className="control-slider-group">
                            <div className="slider-header">
                                <span>w₂: Sidelobe Penalty Weight</span>
                                <span className="slider-val">{w2.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={w2} 
                                onChange={(e) => setOptimizerWeights({ ...optimizerWeights, w2: parseFloat(e.target.value) })} 
                            />
                        </div>

                        <div className="control-slider-group">
                            <div className="slider-header">
                                <span>w₃: Resolution Penalty Weight</span>
                                <span className="slider-val">{w3.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={w3} 
                                onChange={(e) => setOptimizerWeights({ ...optimizerWeights, w3: parseFloat(e.target.value) })} 
                            />
                        </div>

                        <div className="control-slider-group">
                            <div className="slider-header">
                                <span>w₄: Range Penalty Weight</span>
                                <span className="slider-val">{w4.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={w4} 
                                onChange={(e) => setOptimizerWeights({ ...optimizerWeights, w4: parseFloat(e.target.value) })} 
                            />
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header">OPTIMIZATION METRICS</div>
                        <div className="data-row"><span>Active Mode Selector:</span> <span className="cyan">{waveformMode.toUpperCase()}</span></div>
                        <div className="data-row"><span>Optimizer State:</span> <span className="green">CONVERGED</span></div>
                        <div className="data-row"><span>Convergence Iterations:</span> <span>1 (Instant DSP)</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
