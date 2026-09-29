#include "uart_comm.h"
#include "stm32f4xx_hal.h"
#include "window.h"
#include <stdio.h>
#include <string.h>

extern UART_HandleTypeDef huart2;

#define RX_BUFFER_SIZE 32
static uint8_t rx_buffer[RX_BUFFER_SIZE];
static volatile uint8_t rx_index = 0;
static volatile uart_command_t latest_command = CMD_NONE;
static volatile uint8_t command_ready = 0;

void uart_comm_init(uint32_t baud_rate) {
    __HAL_RCC_USART2_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    huart2.Instance = USART2;
    huart2.Init.BaudRate = baud_rate;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    huart2.Init.Mode = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart2.Init.OverSampling = UART_OVERSAMPLING_16;
    if (HAL_UART_Init(&huart2) != HAL_OK) {
        // Error handling
    }

    HAL_NVIC_SetPriority(USART2_IRQn, 1, 0);
    HAL_NVIC_EnableIRQ(USART2_IRQn);

    // Start receiving character by character
    HAL_UART_Receive_IT(&huart2, &rx_buffer[rx_index], 1);
}

void uart_comm_send_telemetry(fsm_state_t state, const env_data_t *env, 
                              const adaptation_result_t *adapt,
                              float cpu_usage, const self_test_result_t *test) {
    char json_buf[256];
    
    // {"st":"TRANSMIT","env":{"t":72,"d":61,"tp":28,"s":35,"b":85},"w":{"m":"LFM","fc":180000,"bw":50000,"dur":4.0,"amp":74},"sys":{"cpu":14,"dma":1},"q":{"snr":27.3}}
    
    snprintf(json_buf, sizeof(json_buf),
        "{\"st\":\"%s\",\"env\":{\"t\":%d,\"d\":%d,\"tp\":%d,\"s\":%d,\"b\":%d},\"w\":{\"m\":\"%s\",\"fc\":%d,\"bw\":%d,\"dur\":%.1f,\"amp\":%d},\"sys\":{\"cpu\":%d,\"dma\":%d},\"q\":{\"snr\":27.3}}\n",
        fsm_state_name(state),
        (int)env->turbidity, (int)env->depth, (int)env->temperature, (int)env->salinity, (int)env->battery,
        waveform_mode_name(adapt->wave_params.mode),
        (int)adapt->wave_params.center_freq_hz,
        (int)adapt->wave_params.bandwidth_hz,
        adapt->wave_params.duration_s * 1000.0f, // in ms for telemetry
        (int)(adapt->wave_params.amplitude * 100.0f),
        (int)cpu_usage,
        test->dma_ok
    );

    HAL_UART_Transmit(&huart2, (uint8_t*)json_buf, strlen(json_buf), HAL_MAX_DELAY);
}

void uart_comm_check_commands(void) {
    // Check handled by interrupt, nothing synchronous needed unless buffering lines
}

uint8_t uart_comm_has_command(void) {
    return command_ready;
}

uart_command_t uart_comm_get_command(void) {
    uart_command_t cmd = latest_command;
    command_ready = 0;
    latest_command = CMD_NONE;
    return cmd;
}

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
    if (huart->Instance == USART2) {
        char c = rx_buffer[rx_index];
        
        // Simple 1-char command parser
        switch (c) {
            case 'S': latest_command = CMD_START; command_ready = 1; break;
            case 'X': latest_command = CMD_STOP; command_ready = 1; break;
            case '1': latest_command = CMD_MODE_LFM; command_ready = 1; break;
            case '2': latest_command = CMD_MODE_GEO; command_ready = 1; break;
            case '3': latest_command = CMD_MODE_PHASE; command_ready = 1; break;
            case 'T': latest_command = CMD_SELF_TEST; command_ready = 1; break;
            case 'A': latest_command = CMD_WINDOW_NONE; command_ready = 1; break;
            case 'B': latest_command = CMD_WINDOW_HAMMING; command_ready = 1; break;
            case 'C': latest_command = CMD_WINDOW_HANN; command_ready = 1; break;
            case 'D': latest_command = CMD_WINDOW_BLACKMAN; command_ready = 1; break;
            default: break;
        }

        // Keep receiving at index 0 for single chars
        HAL_UART_Receive_IT(&huart2, &rx_buffer[0], 1);
    }
}

void USART2_IRQHandler(void) {
    HAL_UART_IRQHandler(&huart2);
}
