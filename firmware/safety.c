#include "safety.h"

static uint8_t current_fault = FAULT_NONE;

void safety_init(void) {
    current_fault = FAULT_NONE;
}

self_test_result_t safety_run_self_test(void) {
    self_test_result_t res;
    // Perform hardware mock checks
    res.adc_ok = 1;
    res.dma_ok = 1;
    res.dac_ok = 1;
    res.timer_ok = 1;
    res.memory_ok = 1;

    // Simulate dummy check for demo
    if (!res.adc_ok) current_fault |= FAULT_ADC;
    if (!res.dma_ok) current_fault |= FAULT_DMA;
    if (!res.dac_ok) current_fault |= FAULT_DAC;
    if (!res.timer_ok) current_fault |= FAULT_TIMER;
    if (!res.memory_ok) current_fault |= FAULT_MEMORY;

    return res;
}

uint8_t safety_validate_params(const adaptation_result_t *result) {
    if (!result) return FAULT_PARAM_RANGE;

    uint8_t fault = FAULT_NONE;

    // Validate Frequency (50kHz to 500kHz)
    if (result->wave_params.center_freq_hz < 50000.0f || result->wave_params.center_freq_hz > 500000.0f) {
        fault |= FAULT_PARAM_RANGE;
    }

    // Validate Bandwidth (10kHz to 200kHz)
    if (result->wave_params.bandwidth_hz < 10000.0f || result->wave_params.bandwidth_hz > 200000.0f) {
        fault |= FAULT_PARAM_RANGE;
    }

    // Validate Duration (0.5ms to 10ms)
    if (result->wave_params.duration_s < 0.0005f || result->wave_params.duration_s > 0.010f) {
        fault |= FAULT_PARAM_RANGE;
    }

    // Validate Amplitude (0.0 to 1.0)
    if (result->wave_params.amplitude < 0.0f || result->wave_params.amplitude > 1.0f) {
        fault |= FAULT_AMPLITUDE;
    }

    current_fault |= fault;
    return fault;
}

uint8_t safety_get_fault_code(void) {
    return current_fault;
}

void safety_clear_fault(void) {
    current_fault = FAULT_NONE;
}
