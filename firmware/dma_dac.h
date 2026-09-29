#ifndef DMA_DAC_H
#define DMA_DAC_H

#include <stdint.h>

void dma_dac_init(uint32_t sample_rate_hz);
void dma_dac_start(uint16_t *buffer, uint16_t num_samples);
void dma_dac_stop(void);
uint8_t dma_dac_is_complete(void);
void dma_dac_set_sample_rate(uint32_t sample_rate_hz);
float dma_dac_get_cpu_usage(void);

#endif // DMA_DAC_H
