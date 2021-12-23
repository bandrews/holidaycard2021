# Holiday Card 2021

## Specifications (contains spoilers!)
  - ESP8266 Microcontroller (ESP-12F)
  - 10 WS2812B-compatible LEDs (800Khz, GRB ordering)
  - Kionix KX023-1025 Accelerometer (Address 0x1E)
  - Lite-On LTR-303ALS-01 Light Sensor (Address 0x29)
  - Digital hall effect sensor
  - Micro USB-B Port (Power only, no data)
  - JST PH-2.0 Data Port

## Pinout
  
  - GPIO0:  Programming Select Button
  - GPIO1:  Serial TX
  - GPIO2:  I2C SDA, onboard LED
  - GPIO3:  Serial RX
  - GPIO4:  Light sensor interrupt
  - GPIO12: Accelerometer interrupt
  - GPIO13: I2C SCL
  - GPIO14: LED data in
  - A0:     Hall Sensor (<150 = magnet present)
