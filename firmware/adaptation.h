#ifndef ADAPTATION_H
#define ADAPTATION_H

#include <stdint.h>
#include "waveform.h"

typedef enum {
    ENV_CLEAR_SHALLOW,
    ENV_MODERATE,
    ENV_MURKY,
    ENV_DEEP_MURKY
} env_class_t;

typedef struct {
    float turbidity;      // 0-100
    float depth;          // 0-100  
    float temperature;    // 0-50 C
    float salinity;       // 0-45 ppt
    float battery;        // 0-100 %
} env_data_t;

typedef struct {
    float env_score;          // 0.0 to 1.0
    env_class_t env_class;
    waveform_params_t wave_params;
} adaptation_result_t;

void adaptation_init(void);
float adaptation_compute_score(const env_data_t *env);
env_class_t adaptation_classify(float score);
void adaptation_optimize(const env_data_t *env, adaptation_result_t *result);
const char* adaptation_class_name(env_class_t cls);

#endif // ADAPTATION_H
