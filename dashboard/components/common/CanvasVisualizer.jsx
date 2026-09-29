/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * CanvasVisualizer Component (CanvasVisualizer.jsx)
 * Renders real-time Canvas visualizations: Waveform, Spectrogram, or FFT
 */

import React, { useRef, useEffect } from 'react';
import { WaveformRenderer, SpectrogramRenderer, FFTRenderer } from '../../renderer.js';

export function CanvasVisualizer({ type, frame, height = 220 }) {
    const canvasRef = useRef(null);
    const waveRendererRef = useRef(null);
    const spectroRendererRef = useRef(null);
    const fftRendererRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (type === 'waveform' && !waveRendererRef.current) {
            waveRendererRef.current = new WaveformRenderer(canvasRef.current);
        } else if (type === 'spectrogram' && !spectroRendererRef.current) {
            spectroRendererRef.current = new SpectrogramRenderer(canvasRef.current);
        } else if (type === 'fft' && !fftRendererRef.current) {
            fftRendererRef.current = new FFTRenderer(canvasRef.current);
        }
    }, [type]);

    useEffect(() => {
        if (!frame || !canvasRef.current) return;

        if (type === 'waveform' && waveRendererRef.current) {
            waveRendererRef.current.draw(frame.waveform, frame.params);
        } else if (type === 'spectrogram' && spectroRendererRef.current) {
            if (frame.fft && frame.fft.magnitudes) {
                spectroRendererRef.current.addColumn(frame.fft.magnitudes);
                spectroRendererRef.current.draw();
            }
        } else if (type === 'fft' && fftRendererRef.current) {
            if (frame.magsDB) {
                fftRendererRef.current.draw(frame.magsDB, 200000, frame.dspMetrics);
            }
        }
    }, [frame, type]);

    return (
        <div className="canvas-wrapper">
            <canvas 
                ref={canvasRef} 
                style={{ height: `${height}px`, width: '100%', display: 'block' }} 
            />
        </div>
    );
}
