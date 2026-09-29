#include "waveform.h"
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

static int16_t sine_lut[SINE_LUT_SIZE];
static waveform_mode_t current_mode = WAVE_LFM;

// Barker 13 code
static const int8_t barker_13[13] = {1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1};

void waveform_init(void) {
    for (uint32_t i = 0; i < SINE_LUT_SIZE; i++) {
        // Values from 0 to 4095 centered at 2048
        float val = sinf((2.0f * M_PI * i) / SINE_LUT_SIZE);
        sine_lut[i] = (int16_t)(val * 2047.0f); 
    }
}

waveform_mode_t waveform_get_mode(void) {
    return current_mode;
}

void waveform_set_mode(waveform_mode_t mode) {
    current_mode = mode;
}

const char* waveform_mode_name(waveform_mode_t mode) {
    switch (mode) {
        case WAVE_LFM: return "LFM";
        case WAVE_GEOMETRIC: return "GEO";
        case WAVE_PHASE_CODED: return "PHASE";
        default: return "UNK";
    }
}

uint16_t waveform_generate(waveform_params_t *params, uint16_t *buffer, uint16_t max_samples) {
    if (!params || !buffer) return 0;
    
    params->mode = current_mode;
    uint32_t num_samples = (uint32_t)(params->duration_s * params->sample_rate_hz);
    if (num_samples > max_samples) {
        num_samples = max_samples;
    }

    float f0 = params->center_freq_hz - (params->bandwidth_hz / 2.0f);
    float f1 = params->center_freq_hz + (params->bandwidth_hz / 2.0f);
    
    if (params->mode == WAVE_LFM) {
        float k = params->bandwidth_hz / params->duration_s;
        for (uint32_t n = 0; n < num_samples; n++) {
            float t = (float)n / params->sample_rate_hz;
            float phase = 2.0f * M_PI * (f0 * t + 0.5f * k * t * t);
            // Normalize phase to LUT index
            uint32_t index = (uint32_t)((phase / (2.0f * M_PI)) * SINE_LUT_SIZE) % SINE_LUT_SIZE;
            int16_t val = (int16_t)(params->amplitude * sine_lut[index]);
            buffer[n] = 2048 + val;
        }
    }
    else if (params->mode == WAVE_GEOMETRIC) {
        float ratio = f1 / f0;
        float phase_accum = 0.0f;
        for (uint32_t n = 0; n < num_samples; n++) {
            float t = (float)n / params->sample_rate_hz;
            float t_norm = t / params->duration_s;
            float current_freq = f0 * powf(ratio, t_norm);
            
            phase_accum += 2.0f * M_PI * current_freq / params->sample_rate_hz;
            uint32_t index = (uint32_t)((phase_accum / (2.0f * M_PI)) * SINE_LUT_SIZE) % SINE_LUT_SIZE;
            int16_t val = (int16_t)(params->amplitude * sine_lut[index]);
            buffer[n] = 2048 + val;
        }
    }
    else if (params->mode == WAVE_PHASE_CODED) {
        // Barker-13 phase coded at center frequency
        float chip_duration = params->duration_s / 13.0f;
        uint32_t samples_per_chip = (uint32_t)(chip_duration * params->sample_rate_hz);
        
        for (uint32_t n = 0; n < num_samples; n++) {
            uint32_t chip_idx = n / samples_per_chip;
            if (chip_idx > 12) chip_idx = 12; // Safety cap
            
            float t = (float)n / params->sample_rate_hz;
            float phase = 2.0f * M_PI * params->center_freq_hz * t;
            
            // If code is -1, phase shift by PI
            if (barker_13[chip_idx] < 0) {
                phase += M_PI;
            }
            
            uint32_t index = (uint32_t)((phase / (2.0f * M_PI)) * SINE_LUT_SIZE) % SINE_LUT_SIZE;
            int16_t val = (int16_t)(params->amplitude * sine_lut[index]);
            buffer[n] = 2048 + val;
        }
    }
    
    return num_samples;
}
