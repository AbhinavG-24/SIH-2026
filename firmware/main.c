#include "stm32f4xx_hal.h"
#include "fsm.h"
#include "adc_sensor.h"
#include "dma_dac.h"
#include "waveform.h"
#include "adaptation.h"
#include "window.h"
#include "safety.h"
#include "uart_comm.h"

// Hardware handles
ADC_HandleTypeDef hadc1;
DAC_HandleTypeDef hdac;
DMA_HandleTypeDef hdma_dac2;
TIM_HandleTypeDef htim6;
UART_HandleTypeDef huart2;

void SystemClock_Config(void);
static void MX_GPIO_Init(void);

int main(void) {
    // HAL Initialization
    HAL_Init();
    
    // Configure System Clock to 180 MHz
    SystemClock_Config();
    
    // Initialize GPIOs (e.g. for LEDs, User Button)
    MX_GPIO_Init();
    
    // Initialize Software Modules and Peripherals
    uart_comm_init(115200);
    adc_sensor_init();
    waveform_init();
    adaptation_init();
    window_init();
    safety_init();
    dma_dac_init(500000); // 500 ksps default sample rate
    fsm_init();

    // The FSM initializes in STATE_BOOT and transitions to STATE_SELF_TEST
    while (1) {
        // Execute current FSM state
        fsm_run();
    }
}

/**
  * @brief System Clock Configuration for 180 MHz using HSI
  */
void SystemClock_Config(void) {
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

    // Configure the main internal regulator output voltage
    __HAL_RCC_PWR_CLK_ENABLE();
    __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

    // Initialize the RCC Oscillators (HSI)
    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
    RCC_OscInitStruct.HSIState = RCC_HSI_ON;
    RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
    RCC_OscInitStruct.PLL.PLLM = 8;
    RCC_OscInitStruct.PLL.PLLN = 180;
    RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
    RCC_OscInitStruct.PLL.PLLQ = 2;
    RCC_OscInitStruct.PLL.PLLR = 2;
    if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) {
        while(1) {} // Error handler
    }

    // Activate the Over-Drive mode for 180 MHz operation
    if (HAL_PWREx_EnableOverDrive() != HAL_OK) {
        while(1) {}
    }

    // Initialize the CPU, AHB and APB buses clocks
    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                                |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4; // 45 MHz
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2; // 90 MHz

    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_5) != HAL_OK) {
        while(1) {}
    }
}

static void MX_GPIO_Init(void) {
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    // Enable GPIO Clocks
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();

    // User Button PC13
    GPIO_InitStruct.Pin = GPIO_PIN_13;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

    // Test LEDs on PB0-PB4 (if available)
    GPIO_InitStruct.Pin = GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_2 | GPIO_PIN_3 | GPIO_PIN_4;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);
}
