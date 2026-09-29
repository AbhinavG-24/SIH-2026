/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Main App Component (App.jsx)
 */

import React from 'react';
import { SonarProvider, useSonar } from './context/SonarContext.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';

// Screens
import { MissionOverview } from './components/screens/MissionOverview.jsx';
import { EnvironmentSensing } from './components/screens/EnvironmentSensing.jsx';
import { AdaptiveControl } from './components/screens/AdaptiveControl.jsx';
import { WaveformLab } from './components/screens/WaveformLab.jsx';
import { LiveTransmission } from './components/screens/LiveTransmission.jsx';
import { SignalAnalysis } from './components/screens/SignalAnalysis.jsx';
import { AutoOptimizer } from './components/screens/AutoOptimizer.jsx';
import { DigitalTwin } from './components/screens/DigitalTwin.jsx';
import { FsmEmbeddedStatus } from './components/screens/FsmEmbeddedStatus.jsx';
import { PowerBattery } from './components/screens/PowerBattery.jsx';
import { DataLogs } from './components/screens/DataLogs.jsx';
import { SystemHealth } from './components/screens/SystemHealth.jsx';
import { Settings } from './components/screens/Settings.jsx';

function MainContent() {
    const { activeScreen } = useSonar();

    const renderScreen = () => {
        switch (activeScreen) {
            case 'mission': return <MissionOverview />;
            case 'environment': return <EnvironmentSensing />;
            case 'control': return <AdaptiveControl />;
            case 'lab': return <WaveformLab />;
            case 'transmission': return <LiveTransmission />;
            case 'analysis': return <SignalAnalysis />;
            case 'optimizer': return <AutoOptimizer />;
            case 'twin': return <DigitalTwin />;
            case 'fsm': return <FsmEmbeddedStatus />;
            case 'power': return <PowerBattery />;
            case 'logs': return <DataLogs />;
            case 'health': return <SystemHealth />;
            case 'settings': return <Settings />;
            default: return <MissionOverview />;
        }
    };

    return (
        <div className="asie-app-shell">
            <Sidebar />
            <div className="asie-main-wrapper">
                <Header />
                <main className="asie-main-body">
                    {renderScreen()}
                </main>
            </div>
        </div>
    );
}

export function App() {
    return (
        <SonarProvider>
            <MainContent />
        </SonarProvider>
    );
}

export default App;
