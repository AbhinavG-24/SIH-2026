/**
 * ASIE — Adaptive Sonar Intelligence Engine
 * Hardware Interface Abstraction (HardwareInterface.js)
 * Supports SIMULATION, WEB SERIAL, and WEBSOCKET modes.
 */

export class HardwareInterface {
    constructor() {
        this.mode = 'SIMULATION'; // 'SIMULATION', 'SERIAL', 'WEBSOCKET'
        this.serialPort = null;
        this.ws = null;
        this.isConnected = false;
        this.callbacks = {
            onTelemetry: null,
            onStatusChange: null,
            onError: null
        };
    }

    setMode(mode) {
        this.mode = mode;
        if (mode === 'SIMULATION') {
            this.disconnectHardware();
        }
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(this.getStatus());
        }
    }

    getStatus() {
        return {
            mode: this.mode,
            isConnected: this.mode === 'SIMULATION' ? true : this.isConnected,
            adcConnected: true,
            dacConnected: true,
            dmaActive: true,
            timerActive: true
        };
    }

    async connectSerial(baudRate = 115200) {
        if (!('serial' in navigator)) {
            throw new Error('Web Serial API is not supported in this browser.');
        }
        try {
            this.serialPort = await navigator.serial.requestPort();
            await this.serialPort.open({ baudRate });
            this.isConnected = true;
            this.mode = 'SERIAL';
            if (this.callbacks.onStatusChange) {
                this.callbacks.onStatusChange(this.getStatus());
            }
            this._readSerialLoop();
            return true;
        } catch (err) {
            this.isConnected = false;
            if (this.callbacks.onError) this.callbacks.onError(err.message);
            throw err;
        }
    }

    async _readSerialLoop() {
        while (this.serialPort && this.serialPort.readable) {
            const reader = this.serialPort.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value && this.callbacks.onTelemetry) {
                        // Parse hardware telemetry binary/JSON stream
                        try {
                            const str = new TextDecoder().decode(value);
                            const json = JSON.parse(str);
                            this.callbacks.onTelemetry(json);
                        } catch (e) {
                            // Raw telemetry chunk handling
                        }
                    }
                }
            } catch (err) {
                if (this.callbacks.onError) this.callbacks.onError(err.message);
            } finally {
                reader.releaseLock();
            }
        }
    }

    connectWebSocket(url = 'ws://localhost:8080') {
        try {
            this.ws = new WebSocket(url);
            this.ws.onopen = () => {
                this.isConnected = true;
                this.mode = 'WEBSOCKET';
                if (this.callbacks.onStatusChange) this.callbacks.onStatusChange(this.getStatus());
            };
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (this.callbacks.onTelemetry) this.callbacks.onTelemetry(data);
                } catch (e) {}
            };
            this.ws.onclose = () => {
                this.isConnected = false;
                if (this.callbacks.onStatusChange) this.callbacks.onStatusChange(this.getStatus());
            };
            this.ws.onerror = (err) => {
                if (this.callbacks.onError) this.callbacks.onError('WebSocket connection error');
            };
        } catch (err) {
            if (this.callbacks.onError) this.callbacks.onError(err.message);
        }
    }

    disconnectHardware() {
        if (this.serialPort) {
            this.serialPort.close().catch(() => {});
            this.serialPort = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    sendParameters(params) {
        if (this.mode === 'SIMULATION') {
            return true;
        }
        const command = JSON.stringify({ command: 'SET_PARAMS', params });
        if (this.mode === 'SERIAL' && this.serialPort && this.serialPort.writable) {
            const writer = this.serialPort.writable.getWriter();
            writer.write(new TextEncoder().encode(command + '\n'));
            writer.releaseLock();
        } else if (this.mode === 'WEBSOCKET' && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(command);
        }
        return true;
    }
}
