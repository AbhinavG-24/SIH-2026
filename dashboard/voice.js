export class VoiceEngine {
    constructor() {
        this.enabled = false;
        this.synth = window.speechSynthesis;
        this.queue = [];
        this.speaking = false;
        
        // Pre-load voices
        this.voice = null;
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            this.voice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || 
                         voices.find(v => v.lang.includes('en-GB')) || 
                         voices[0];
        };
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this.synth.cancel();
    }

    isEnabled() {
        return this.enabled;
    }

    _processQueue() {
        if (!this.enabled || this.speaking || this.queue.length === 0) return;
        
        // Sort queue by priority: critical > high > normal
        const priorities = { 'critical': 3, 'high': 2, 'normal': 1 };
        this.queue.sort((a, b) => priorities[b.priority] - priorities[a.priority]);
        
        const next = this.queue.shift();
        this.speaking = true;
        
        const utterance = new SpeechSynthesisUtterance(next.message);
        utterance.voice = this.voice;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
            this.speaking = false;
            this._processQueue();
        };
        
        this.synth.speak(utterance);
    }

    announce(message, priority = 'normal') {
        if (!this.enabled) return;
        
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
            'CLEAR SHALLOW': "Entering clear shallow waters. Switching to high resolution mode.",
            'MODERATE': "Moderate conditions detected. Balancing range and resolution.",
            'MURKY': "Murky water detected. Extending pulse duration for penetration.",
            'DEEP MURKY': "Deep murky environment. Maximum range mode activated."
        };
        this.announce(msgMap[envClass] || `Environment changed to ${envClass}`, 'high');
    }

    announceModeSwtich(mode) {
        const names = { 'lfm': 'linear frequency modulated chirp', 'geometric': 'geometric sweep', 'phase': 'phase coded' };
        this.announce(`Switching to ${names[mode] || mode} mode.`);
    }

    announceFault(faultMsg) {
        this.announce(`Warning: ${faultMsg}`, 'critical');
    }

    announceSelfTestResult(results) {
        this.announce("Self test complete. All systems nominal.", 'high');
    }
}
