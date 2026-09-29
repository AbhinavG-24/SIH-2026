/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * SonarContext React State Management
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SonarSimulator } from '../services/SonarSimulator.js';
import { computeFFT, magnitudesToDB, computeMetrics } from '../services/DSP.js';
import { VoiceEngine } from '../services/VoiceEngine.js';
import { HardwareInterface } from '../services/HardwareInterface.js';

const SonarContext = createContext();

export function SonarProvider({ children }) {
    const [activeScreen, setActiveScreen] = useState('mission');
    const [isRunning, setIsRunning] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [demoStep, setDemoStep] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [hardwareMode, setHardwareMode] = useState('SIMULATION');
    
    // Core Parameters
    const [env, setEnvState] = useState({ turbidity: 40, depth: 45, temperature: 22, salinity: 35, battery: 75 });
    const [activePreset, setActivePreset] = useState('moderate');
    const [waveformMode, setWaveformModeState] = useState('auto');
    const [strategy, setStrategyState] = useState('Balanced');
    const [windowType, setWindowTypeState] = useState('hamming');
    const [optimizerWeights, setOptimizerWeightsState] = useState({ w1: 0.25, w2: 0.30, w3: 0.25, w4: 0.20 });
    const [labParams, setLabParamsState] = useState(null);
    
    // System & FSM state
    const FSM_CYCLE = ['IDLE', 'SENSE', 'CLASSIFY', 'OPTIMIZE', 'GENERATE', 'WINDOW', 'TRANSMIT', 'MEASURE', 'EVALUATE'];
    const [fsmState, setFsmState] = useState('TRANSMIT');
    const [activeFault, setActiveFault] = useState(null);
    const [selfTestRunning, setSelfTestRunning] = useState(false);
    const [selfTestLeds, setSelfTestLeds] = useState({ adc: false, dma: false, dac: false, tmr: false, mem: false });

    // Telemetry & Logs
    const [latestFrame, setLatestFrame] = useState(null);
    const [logs, setLogs] = useState([]);

    // Singletons
    const simRef = useRef(new SonarSimulator());
    const voiceRef = useRef(new VoiceEngine());
    const hwRef = useRef(new HardwareInterface());
    const fsmIdxRef = useRef(0);

    // Initial setup
    useEffect(() => {
        simRef.current.setEnvironment(env);
        simRef.current.setWindow(windowType);
        simRef.current.setMode(waveformMode);
        simRef.current.setStrategy(strategy);
    }, []);

    // FSM Timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (isRunning && !activeFault && !selfTestRunning) {
                fsmIdxRef.current = (fsmIdxRef.current + 1) % FSM_CYCLE.length;
                setFsmState(FSM_CYCLE[fsmIdxRef.current]);
            }
        }, 350);
        return () => clearInterval(interval);
    }, [isRunning, activeFault, selfTestRunning]);

    // Frame Execution Loop (~30fps)
    useEffect(() => {
        let frameInterval = null;
        if (isRunning && !selfTestRunning) {
            frameInterval = setInterval(() => {
                const simResult = simRef.current.generatePulse();
                
                // Compute DSP FFT & metrics
                const fft = computeFFT(simResult.waveform);
                const magsDB = magnitudesToDB(fft.magnitudes);
                const dspMetrics = computeMetrics(fft.magnitudes, simRef.current.sampleRate);
                
                const frameData = {
                    ...simResult,
                    fft,
                    magsDB,
                    dspMetrics
                };

                setLatestFrame(frameData);

                // Append telemetry log entry
                const ts = new Date().toISOString().substring(11, 19);
                const isSigValid = simResult.loopInfo.snr > 18 && simResult.digitalTwin.fcError < 5.0;
                
                const newLogRow = {
                    id: Date.now() + Math.random(),
                    timestamp: ts,
                    score: simResult.params.envScore.toFixed(3),
                    envClass: simResult.params.envClass,
                    turbidity: env.turbidity,
                    depth: env.depth,
                    temp: env.temperature,
                    salinity: env.salinity,
                    mode: simResult.params.mode.toUpperCase(),
                    fc: simResult.params.fc.toFixed(1),
                    bw: simResult.params.bw.toFixed(1),
                    pulse: simResult.params.duration.toFixed(2),
                    amp: simResult.params.amplitude.toFixed(1),
                    quality: isSigValid ? 'VALID' : 'INVALID',
                    battery: env.battery,
                    power: simResult.metrics.avgPowerW.toFixed(2)
                };

                setLogs(prev => [newLogRow, ...prev.slice(0, 99)]);
            }, 50);
        }
        return () => {
            if (frameInterval) clearInterval(frameInterval);
        };
    }, [isRunning, selfTestRunning, env]);

    // Actions
    const updateEnv = (newEnv) => {
        const merged = { ...env, ...newEnv };
        setEnvState(merged);
        simRef.current.setEnvironment(merged);
    };

    const applyPreset = (presetKey) => {
        setActivePreset(presetKey);
        const presetVals = simRef.current.applyPreset(presetKey);
        setEnvState(presetVals);
        if (voiceEnabled) {
            const { envClass } = simRef.current.getEnvScoreAndClass();
            voiceRef.current.announceEnvironmentChange(envClass);
        }
    };

    const setWaveformMode = (mode) => {
        setWaveformModeState(mode);
        simRef.current.setMode(mode);
        if (voiceEnabled) voiceRef.current.announceModeSwitch(mode);
    };

    const setStrategy = (strat) => {
        setStrategyState(strat);
        simRef.current.setStrategy(strat);
    };

    const setWindowType = (win) => {
        setWindowTypeState(win);
        simRef.current.setWindow(win);
    };

    const setOptimizerWeights = (w) => {
        setOptimizerWeightsState(w);
        simRef.current.setOptimizerWeights(w.w1, w.w2, w.w3, w.w4);
    };

    const setLabParams = (params) => {
        setLabParamsState(params);
        simRef.current.setLabParams(params);
    };

    const toggleVoice = () => {
        const next = !voiceEnabled;
        setVoiceEnabled(next);
        voiceRef.current.setEnabled(next);
        if (next) voiceRef.current.announce('Voice system activated.');
    };

    const toggleTransmission = () => {
        const next = !isRunning;
        setIsRunning(next);
        if (!next) {
            setFsmState('IDLE');
        }
    };

    const triggerFault = (faultName) => {
        setActiveFault(faultName);
        setFsmState('FAULT');
        simRef.current.triggerFault(faultName);
        if (voiceEnabled) voiceRef.current.announceFault(faultName);
    };

    const clearFault = () => {
        setActiveFault(null);
        simRef.current.clearFault();
        setFsmState('IDLE');
    };

    const runSelfTest = () => {
        setSelfTestRunning(true);
        setFsmState('SELF_TEST');
        if (voiceEnabled) voiceRef.current.announce('Initiating system self-test.');
        
        const leds = ['adc', 'dma', 'dac', 'tmr', 'mem'];
        setSelfTestLeds({ adc: false, dma: false, dac: false, tmr: false, mem: false });
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < leds.length) {
                const key = leds[i];
                setSelfTestLeds(prev => ({ ...prev, [key]: true }));
                i++;
            } else {
                clearInterval(interval);
                setSelfTestRunning(false);
                setFsmState('IDLE');
                if (voiceEnabled) voiceRef.current.announceSelfTestResult();
            }
        }, 400);
    };

    // 60-Second Hackathon Judge Demo Mode Sequence
    const startJudgeDemo = () => {
        setIsDemoMode(true);
        setDemoStep(1);
        setActiveScreen('environment');
        applyPreset('clear');

        setTimeout(() => {
            setDemoStep(2);
            applyPreset('deepMurky');
        }, 5000);

        setTimeout(() => {
            setDemoStep(3);
            setActiveScreen('analysis');
        }, 10000);

        setTimeout(() => {
            setDemoStep(4);
            setActiveScreen('fsm');
        }, 15000);

        setTimeout(() => {
            setDemoStep(5);
            setActiveScreen('power');
        }, 20000);

        setTimeout(() => {
            setDemoStep(6);
            setActiveScreen('twin');
        }, 25000);

        setTimeout(() => {
            setIsDemoMode(false);
            setDemoStep(0);
            setActiveScreen('mission');
        }, 30000);
    };

    const exportCSV = () => {
        let csv = "Timestamp,Score,EnvClass,Turb,Depth,Temp,Salinity,Mode,Fc_kHz,BW_kHz,Pulse_ms,Amp_pct,Quality,Battery,Power_W\n";
        logs.forEach(row => {
            csv += `${row.timestamp},${row.score},${row.envClass},${row.turbidity},${row.depth},${row.temp},${row.salinity},${row.mode},${row.fc},${row.bw},${row.pulse},${row.amp},${row.quality},${row.battery},${row.power}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asie_telemetry_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <SonarContext.Provider value={{
            activeScreen, setActiveScreen,
            isRunning, toggleTransmission,
            isDemoMode, demoStep, startJudgeDemo,
            voiceEnabled, toggleVoice,
            hardwareMode, setHardwareMode,
            env, updateEnv,
            activePreset, applyPreset,
            waveformMode, setWaveformMode,
            strategy, setStrategy,
            windowType, setWindowType,
            optimizerWeights, setOptimizerWeights,
            labParams, setLabParams,
            fsmState, activeFault, triggerFault, clearFault,
            selfTestRunning, selfTestLeds, runSelfTest,
            latestFrame, logs, exportCSV
        }}>
            {children}
        </SonarContext.Provider>
    );
}

export function useSonar() {
    return useContext(SonarContext);
}
