/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Voice Engine Module (SpeechSynthesis API)
 */

export class VoiceEngine {
    constructor() {
        this.enabled = false;
        this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.queue = [];
        this.speaking = false;
        this.voice = null;
        
        if (this.synth) {
            const loadVoices = () => {
                const voices = this.synth.getVoices();
                this.voice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || 
                             voices.find(v => v.lang.includes('en-GB')) || 
                             voices.find(v => v.lang.includes('en')) ||
                             voices[0];
            };
            loadVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = loadVoices;
            }
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.synth) {
            this.synth.cancel();
            this.queue = [];
            this.speaking = false;
        }
    }

    _processQueue() {
        if (!this.enabled || !this.synth || this.speaking || this.queue.length === 0) return;
        
        const priorities = { 'critical': 3, 'high': 2, 'normal': 1 };
        this.queue.sort((a, b) => priorities[b.priority] - priorities[a.priority]);
        
        const next = this.queue.shift();
        this.speaking = true;
        
        const utterance = new SpeechSynthesisUtterance(next.message);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
            this.speaking = false;
            this._processQueue();
        };
        utterance.onerror = () => {
            this.speaking = false;
            this._processQueue();
        };
        
        this.synth.speak(utterance);
    }

    announce(message, priority = 'normal') {
        if (!this.enabled || !this.synth) return;
        
        if (priority === 'critical') {
            this.synth.cancel();
            this.queue = [];
            this.speaking = false;
        } else if (priority === 'high' && this.speaking) {
            this.synth.cancel();
            this.speaking = false;
        }
        
        this.queue.push({ message, priority });
        this._processQueue();
    }

    announceEnvironmentChange(envClass) {
        const msgMap = {
            'CLEAR SHALLOW': "Clear shallow conditions. High resolution mode engaged.",
            'MODERATE': "Moderate environment. Balanced transmission parameters active.",
            'MURKY': "Murky water detected. Extending pulse duration for penetration.",
            'DEEP MURKY': "Deep murky environment. Maximum range propagation active.",
            'LOW BATTERY': "Low battery warning. Entering eco power conservation mode.",
            'TURBULENT': "Turbulent waters detected. Phase coded noise rejection active."
        };
        this.announce(msgMap[envClass] || `Environment updated to ${envClass}`, 'high');
    }

    announceModeSwitch(mode) {
        const names = { 
            'lfm': 'Linear Frequency Modulated Chirp', 
            'geometric': 'Geometric Frequency Sweep', 
            'phase': 'Phase Coded Barker Sequence' 
        };
        this.announce(`Switching to ${names[mode] || mode} mode.`);
    }

    announceFault(faultMsg) {
        this.announce(`Warning fault: ${faultMsg}`, 'critical');
    }

    announceSelfTestResult() {
        this.announce("System self-test complete. All embedded subsystems nominal.", 'high');
    }
}
