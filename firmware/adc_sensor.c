#include "adc_sensor.h"
#include "stm32f4xx_hal.h"

extern ADC_HandleTypeDef hadc1;
static DMA_HandleTypeDef hdma_adc1;

#define ADC_CHANNELS 3
#define ADC_AVG_SAMPLES 8
static uint16_t adc_buffer[ADC_CHANNELS * ADC_AVG_SAMPLES];

static uint16_t avg_turbidity_raw = 0;
static uint16_t avg_depth_raw = 0;
static uint16_t avg_temperature_raw = 0;

void adc_sensor_init(void) {
    __HAL_RCC_ADC1_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_DMA2_CLK_ENABLE();

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_4;
    GPIO_InitStruct.Mode = GPIO_MODE_ANALOG;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    hadc1.Instance = ADC1;
    hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;
    hadc1.Init.Resolution = ADC_RESOLUTION_12B;
    hadc1.Init.ScanConvMode = ENABLE;
    hadc1.Init.ContinuousConvMode = DISABLE;
    hadc1.Init.DiscontinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
    hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
    hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
    hadc1.Init.NbrOfConversion = ADC_CHANNELS;
    hadc1.Init.DMAContinuousRequests = ENABLE;
    hadc1.Init.EOCSelection = ADC_EOC_SEQ_CONV;
    if (HAL_ADC_Init(&hadc1) != HAL_OK) {
        // Error handling
    }

    ADC_ChannelConfTypeDef sConfig = {0};
    sConfig.Channel = ADC_CHANNEL_0; // PA0
    sConfig.Rank = 1;
    sConfig.SamplingTime = ADC_SAMPLETIME_84CYCLES;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    sConfig.Channel = ADC_CHANNEL_1; // PA1
    sConfig.Rank = 2;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    sConfig.Channel = ADC_CHANNEL_4; // PA4
    sConfig.Rank = 3;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    hdma_adc1.Instance = DMA2_Stream0;
    hdma_adc1.Init.Channel = DMA_CHANNEL_0;
    hdma_adc1.Init.Direction = DMA_PERIPH_TO_MEMORY;
    hdma_adc1.Init.PeriphInc = DMA_PINC_DISABLE;
    hdma_adc1.Init.MemInc = DMA_MINC_ENABLE;
    hdma_adc1.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;
    hdma_adc1.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;
    hdma_adc1.Init.Mode = DMA_CIRCULAR;
    hdma_adc1.Init.Priority = DMA_PRIORITY_LOW;
    hdma_adc1.Init.FIFOMode = DMA_FIFOMODE_DISABLE;
    if (HAL_DMA_Init(&hdma_adc1) != HAL_OK) {
        // Error handling
    }

    __HAL_LINKDMA(&hadc1, DMA_Handle, hdma_adc1);

    HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, ADC_CHANNELS * ADC_AVG_SAMPLES);
}

void adc_sensor_read(env_data_t *env) {
    if (!env) return;

    // Trigger ADC manually if not in continuous mode (we have continuous requests, but software start)
    // Wait for conversion block to complete if doing a single shot round
    HAL_ADC_Start(&hadc1);
    HAL_Delay(1); // Give DMA time to average

    uint32_t sum_t = 0, sum_d = 0, sum_temp = 0;
    for (int i = 0; i < ADC_AVG_SAMPLES; i++) {
        sum_t += adc_buffer[i * ADC_CHANNELS + 0];
        sum_d += adc_buffer[i * ADC_CHANNELS + 1];
        sum_temp += adc_buffer[i * ADC_CHANNELS + 2];
    }

    avg_turbidity_raw = sum_t / ADC_AVG_SAMPLES;
    avg_depth_raw = sum_d / ADC_AVG_SAMPLES;
    avg_temperature_raw = sum_temp / ADC_AVG_SAMPLES;

    // Conversions
    env->turbidity = (avg_turbidity_raw / 4095.0f) * 100.0f;
    env->depth = (avg_depth_raw / 4095.0f) * 100.0f;
    env->temperature = (avg_temperature_raw / 4095.0f) * 50.0f;
    
    // Simulate others for demonstration
    env->salinity = 35.0f; // Standard ppt
    env->battery = 98.0f;  // Fake battery reading
}

uint16_t adc_sensor_get_raw(uint8_t channel) {
    if (channel == 0) return avg_turbidity_raw;
    if (channel == 1) return avg_depth_raw;
    if (channel == 2) return avg_temperature_raw;
    return 0;
}
