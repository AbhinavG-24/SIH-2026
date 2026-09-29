#ifndef WINDOW_H
#define WINDOW_H

#include <stdint.h>

typedef enum {
    WIN_NONE,
    WIN_HAMMING,
    WIN_HANN,
    WIN_BLACKMAN
} window_type_t;

void window_init(void);
void window_apply(uint16_t *buffer, uint16_t num_samples, window_type_t type);
window_type_t window_get_type(void);
void window_set_type(window_type_t type);
const char* window_type_name(window_type_t type);

#endif // WINDOW_H
