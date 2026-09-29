#ifndef UART_COMM_H
#define UART_COMM_H

#include <stdint.h>
#include "fsm.h"
#include "adaptation.h"
#include "safety.h"

void uart_comm_init(uint32_t baud_rate);
void uart_comm_send_telemetry(fsm_state_t state, const env_data_t *env, 
                              const adaptation_result_t *adapt,
                              float cpu_usage, const self_test_result_t *test);
void uart_comm_check_commands(void);
uint8_t uart_comm_has_command(void);

// Commands from PC
typedef enum {
    CMD_NONE,
    CMD_START,
    CMD_STOP,
    CMD_MODE_LFM,
    CMD_MODE_GEO,
    CMD_MODE_PHASE,
    CMD_SELF_TEST,
    CMD_WINDOW_NONE,
    CMD_WINDOW_HAMMING,
    CMD_WINDOW_HANN,
    CMD_WINDOW_BLACKMAN
} uart_command_t;

uart_command_t uart_comm_get_command(void);

#endif // UART_COMM_H
