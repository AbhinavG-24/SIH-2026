#ifndef WAVEFORM_H
#define WAVEFORM_H

#include <stdint.h>

#define WAVEFORM_BUFFER_SIZE  4096
#define SINE_LUT_SIZE         4096

typedef enum {
    WAVE_LFM,
    WAVE_GEOMETRIC,
    WAVE_PHASE_CODED
} waveform_mode_t;

typedef struct {
    float center_freq_hz;     // Center frequency
    float bandwidth_hz;       // Bandwidth
    float duration_s;         // Pulse duration in seconds
    float amplitude;          // 0.0 to 1.0
    waveform_mode_t mode;
    float sample_rate_hz;     // DAC sample rate
} waveform_params_t;

void waveform_init(void);
uint16_t waveform_generate(waveform_params_t *params, uint16_t *buffer, uint16_t max_samples);
waveform_mode_t waveform_get_mode(void);
void waveform_set_mode(waveform_mode_t mode);
const char* waveform_mode_name(waveform_mode_t mode);

#endif // WAVEFORM_H
