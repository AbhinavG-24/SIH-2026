#include "window.h"
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

static window_type_t current_window = WIN_HAMMING;

void window_init(void) {
    // Initialized statics
}

window_type_t window_get_type(void) {
    return current_window;
}

void window_set_type(window_type_t type) {
    current_window = type;
}

const char* window_type_name(window_type_t type) {
    switch (type) {
        case WIN_NONE: return "NONE";
        case WIN_HAMMING: return "HAMMING";
        case WIN_HANN: return "HANN";
        case WIN_BLACKMAN: return "BLACKMAN";
        default: return "UNKNOWN";
    }
}

void window_apply(uint16_t *buffer, uint16_t num_samples, window_type_t type) {
    if (!buffer || num_samples == 0 || type == WIN_NONE) return;

    for (uint16_t n = 0; n < num_samples; n++) {
        // Center around 0
        float val = (buffer[n] - 2048) / 2048.0f;
        float w = 1.0f;
        float coeff = (2.0f * M_PI * n) / (num_samples - 1);

        switch (type) {
            case WIN_HAMMING:
                w = 0.54f - 0.46f * cosf(coeff);
                break;
            case WIN_HANN:
                w = 0.5f * (1.0f - cosf(coeff));
                break;
            case WIN_BLACKMAN:
                w = 0.42f - 0.5f * cosf(coeff) + 0.08f * cosf(2.0f * coeff);
                break;
            default:
                break;
        }

        val *= w;
        
        int32_t final_val = 2048 + (int32_t)(val * 2048.0f);
        if (final_val > 4095) final_val = 4095;
        if (final_val < 0) final_val = 0;

        buffer[n] = (uint16_t)final_val;
    }
}
