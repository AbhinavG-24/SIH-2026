#include "adaptation.h"

void adaptation_init(void) {
    // Initialization if required
}

float adaptation_compute_score(const env_data_t *env) {
    if (!env) return 0.0f;

    // Normalize inputs
    float t_norm = env->turbidity / 100.0f;
    float d_norm = env->depth / 100.0f;
    float s_norm = env->salinity / 45.0f;
    float temp_norm = (50.0f - env->temperature) / 50.0f;
    float b_norm = (100.0f - env->battery) / 100.0f;

    // Clamp normalized values to [0,1]
    if (t_norm > 1.0f) t_norm = 1.0f; else if (t_norm < 0.0f) t_norm = 0.0f;
    if (d_norm > 1.0f) d_norm = 1.0f; else if (d_norm < 0.0f) d_norm = 0.0f;
    if (s_norm > 1.0f) s_norm = 1.0f; else if (s_norm < 0.0f) s_norm = 0.0f;
    if (temp_norm > 1.0f) temp_norm = 1.0f; else if (temp_norm < 0.0f) temp_norm = 0.0f;
    if (b_norm > 1.0f) b_norm = 1.0f; else if (b_norm < 0.0f) b_norm = 0.0f;

    // E = 0.35*turb + 0.30*depth + 0.15*sal + 0.10*temp_inv + 0.10*bat_inv
    float e = 0.35f * t_norm + 0.30f * d_norm + 0.15f * s_norm + 0.10f * temp_norm + 0.10f * b_norm;

    if (e > 1.0f) return 1.0f;
    if (e < 0.0f) return 0.0f;
    
    return e;
}

env_class_t adaptation_classify(float score) {
    if (score < 0.25f) {
        return ENV_CLEAR_SHALLOW;
    } else if (score < 0.45f) {
        return ENV_MODERATE;
    } else if (score < 0.65f) {
        return ENV_MURKY;
    } else {
        return ENV_DEEP_MURKY;
    }
}

const char* adaptation_class_name(env_class_t cls) {
    switch (cls) {
        case ENV_CLEAR_SHALLOW: return "CLEAR_SHALLOW";
        case ENV_MODERATE: return "MODERATE";
        case ENV_MURKY: return "MURKY";
        case ENV_DEEP_MURKY: return "DEEP_MURKY";
        default: return "UNKNOWN";
    }
}

void adaptation_optimize(const env_data_t *env, adaptation_result_t *result) {
    if (!env || !result) return;
    
    float E = result->env_score;
    
    // Default sample rate 500ksps
    result->wave_params.sample_rate_hz = 500000.0f;

    // Optimize params based on Environment Score (E)
    result->wave_params.center_freq_hz = 450000.0f - (300000.0f * E);
    result->wave_params.bandwidth_hz = 120000.0f - (80000.0f * E);
    result->wave_params.duration_s = 0.001f + (0.005f * E);
    result->wave_params.amplitude = 0.5f + (0.4f * E);

    // Battery awareness
    if (env->battery < 30.0f) {
        result->wave_params.amplitude *= 0.8f; // Reduce by 20%
    }
}
