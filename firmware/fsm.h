#ifndef FSM_H
#define FSM_H

#include <stdint.h>

typedef enum {
    STATE_BOOT,
    STATE_SELF_TEST,
    STATE_IDLE,
    STATE_SENSOR_READ,
    STATE_ENV_CLASSIFY,
    STATE_OPTIMIZE,
    STATE_SAFETY_CHECK,
    STATE_WAVE_GENERATE,
    STATE_WINDOW_APPLY,
    STATE_DMA_START,
    STATE_TRANSMIT,
    STATE_MEASURE,
    STATE_EVALUATE,
    STATE_FAULT
} fsm_state_t;

typedef struct {
    fsm_state_t current_state;
    fsm_state_t previous_state;
    uint32_t state_entry_tick;
    uint32_t pulse_count;
    uint8_t fault_code;
    uint8_t is_running;
} fsm_context_t;

void fsm_init(void);
void fsm_run(void);
void fsm_set_running(uint8_t run);
fsm_state_t fsm_get_state(void);
const char* fsm_state_name(fsm_state_t state);

#endif // FSM_H
