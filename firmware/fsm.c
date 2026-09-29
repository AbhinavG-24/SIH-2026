#include "fsm.h"
#include "adc_sensor.h"
#include "dma_dac.h"
#include "waveform.h"
#include "adaptation.h"
#include "window.h"
#include "safety.h"
#include "uart_comm.h"
#include "stm32f4xx_hal.h"

static fsm_context_t ctx;

// External telemetry variables
static env_data_t current_env;
static adaptation_result_t current_adapt;
static self_test_result_t test_result;
static uint16_t dac_buffer[WAVEFORM_BUFFER_SIZE];
static uint16_t generated_samples = 0;

void fsm_init(void) {
    ctx.current_state = STATE_BOOT;
    ctx.previous_state = STATE_BOOT;
    ctx.state_entry_tick = HAL_GetTick();
    ctx.pulse_count = 0;
    ctx.fault_code = FAULT_NONE;
    ctx.is_running = 0;
}

static void fsm_transition(fsm_state_t new_state) {
    ctx.previous_state = ctx.current_state;
    ctx.current_state = new_state;
    ctx.state_entry_tick = HAL_GetTick();
}

void fsm_set_running(uint8_t run) {
    ctx.is_running = run;
}

fsm_state_t fsm_get_state(void) {
    return ctx.current_state;
}

const char* fsm_state_name(fsm_state_t state) {
    switch (state) {
        case STATE_BOOT: return "BOOT";
        case STATE_SELF_TEST: return "SELF_TEST";
        case STATE_IDLE: return "IDLE";
        case STATE_SENSOR_READ: return "SENSOR_READ";
        case STATE_ENV_CLASSIFY: return "ENV_CLASSIFY";
        case STATE_OPTIMIZE: return "OPTIMIZE";
        case STATE_SAFETY_CHECK: return "SAFETY_CHECK";
        case STATE_WAVE_GENERATE: return "WAVE_GENERATE";
        case STATE_WINDOW_APPLY: return "WINDOW_APPLY";
        case STATE_DMA_START: return "DMA_START";
        case STATE_TRANSMIT: return "TRANSMIT";
        case STATE_MEASURE: return "MEASURE";
        case STATE_EVALUATE: return "EVALUATE";
        case STATE_FAULT: return "FAULT";
        default: return "UNKNOWN";
    }
}

static void process_commands(void) {
    uart_comm_check_commands();
    if (uart_comm_has_command()) {
        uart_command_t cmd = uart_comm_get_command();
        switch (cmd) {
            case CMD_START: ctx.is_running = 1; break;
            case CMD_STOP: ctx.is_running = 0; break;
            case CMD_MODE_LFM: waveform_set_mode(WAVE_LFM); break;
            case CMD_MODE_GEO: waveform_set_mode(WAVE_GEOMETRIC); break;
            case CMD_MODE_PHASE: waveform_set_mode(WAVE_PHASE_CODED); break;
            case CMD_WINDOW_NONE: window_set_type(WIN_NONE); break;
            case CMD_WINDOW_HAMMING: window_set_type(WIN_HAMMING); break;
            case CMD_WINDOW_HANN: window_set_type(WIN_HANN); break;
            case CMD_WINDOW_BLACKMAN: window_set_type(WIN_BLACKMAN); break;
            case CMD_SELF_TEST: 
                if (ctx.current_state == STATE_IDLE) {
                    fsm_transition(STATE_SELF_TEST);
                }
                break;
            default: break;
        }
    }
}

void fsm_run(void) {
    // Continually check UART commands in non-critical states
    if (ctx.current_state != STATE_TRANSMIT) {
        process_commands();
    }

    switch (ctx.current_state) {
        case STATE_BOOT:
            fsm_transition(STATE_SELF_TEST);
            break;

        case STATE_SELF_TEST:
            test_result = safety_run_self_test();
            ctx.fault_code = safety_get_fault_code();
            if (ctx.fault_code == FAULT_NONE) {
                fsm_transition(STATE_IDLE);
            } else {
                fsm_transition(STATE_FAULT);
            }
            break;

        case STATE_IDLE:
            if (ctx.is_running) {
                fsm_transition(STATE_SENSOR_READ);
            }
            break;

        case STATE_SENSOR_READ:
            adc_sensor_read(&current_env);
            fsm_transition(STATE_ENV_CLASSIFY);
            break;

        case STATE_ENV_CLASSIFY:
            current_adapt.env_score = adaptation_compute_score(&current_env);
            current_adapt.env_class = adaptation_classify(current_adapt.env_score);
            fsm_transition(STATE_OPTIMIZE);
            break;

        case STATE_OPTIMIZE:
            adaptation_optimize(&current_env, &current_adapt);
            fsm_transition(STATE_SAFETY_CHECK);
            break;

        case STATE_SAFETY_CHECK:
            if (safety_validate_params(&current_adapt) == FAULT_NONE) {
                fsm_transition(STATE_WAVE_GENERATE);
            } else {
                ctx.fault_code = safety_get_fault_code();
                fsm_transition(STATE_FAULT);
            }
            break;

        case STATE_WAVE_GENERATE:
            dma_dac_set_sample_rate(current_adapt.wave_params.sample_rate_hz);
            generated_samples = waveform_generate(&current_adapt.wave_params, dac_buffer, WAVEFORM_BUFFER_SIZE);
            fsm_transition(STATE_WINDOW_APPLY);
            break;

        case STATE_WINDOW_APPLY:
            window_apply(dac_buffer, generated_samples, window_get_type());
            fsm_transition(STATE_DMA_START);
            break;

        case STATE_DMA_START:
            dma_dac_start(dac_buffer, generated_samples);
            fsm_transition(STATE_TRANSMIT);
            break;

        case STATE_TRANSMIT:
            // Non-blocking wait for DMA completion
            if (dma_dac_is_complete()) {
                fsm_transition(STATE_MEASURE);
            }
            break;

        case STATE_MEASURE:
            dma_dac_stop();
            ctx.pulse_count++;
            fsm_transition(STATE_EVALUATE);
            break;

        case STATE_EVALUATE:
            uart_comm_send_telemetry(ctx.current_state, &current_env, &current_adapt, dma_dac_get_cpu_usage(), &test_result);
            // Decide next step (currently a loop if still running)
            if (ctx.is_running) {
                fsm_transition(STATE_SENSOR_READ);
            } else {
                fsm_transition(STATE_IDLE);
            }
            break;

        case STATE_FAULT:
            // Send fault telemetry
            uart_comm_send_telemetry(ctx.current_state, &current_env, &current_adapt, dma_dac_get_cpu_usage(), &test_result);
            // Simulate clearing fault on next tick if user stopped system or reset
            if (!ctx.is_running) {
                safety_clear_fault();
                ctx.fault_code = FAULT_NONE;
                fsm_transition(STATE_IDLE);
            }
            break;
    }
}
