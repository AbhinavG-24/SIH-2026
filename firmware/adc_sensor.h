#ifndef ADC_SENSOR_H
#define ADC_SENSOR_H

#include <stdint.h>
#include "adaptation.h"

void adc_sensor_init(void);
void adc_sensor_read(env_data_t *env);
uint16_t adc_sensor_get_raw(uint8_t channel);

#endif // ADC_SENSOR_H
