#ifndef SAFETY_H
#define SAFETY_H

#include <stdint.h>
#include "adaptation.h"

#define FAULT_NONE          0x00
#define FAULT_ADC           0x01
#define FAULT_DMA           0x02
#define FAULT_DAC           0x04
#define FAULT_TIMER         0x08
#define FAULT_MEMORY        0x10
#define FAULT_PARAM_RANGE   0x20
#define FAULT_AMPLITUDE     0x40

typedef struct {
    uint8_t adc_ok;
    uint8_t dma_ok;
    uint8_t dac_ok;
    uint8_t timer_ok;
    uint8_t memory_ok;
} self_test_result_t;

void safety_init(void);
self_test_result_t safety_run_self_test(void);
uint8_t safety_validate_params(const adaptation_result_t *result);
uint8_t safety_get_fault_code(void);
void safety_clear_fault(void);

#endif // SAFETY_H
