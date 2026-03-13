export type BoardKind =
  | 'arduino-uno'
  | 'arduino-nano'
  | 'arduino-mega'
  | 'raspberry-pi-pico'   // RP2040, browser emulation
  | 'raspberry-pi-3'      // QEMU ARM64, backend
  | 'esp32'               // Xtensa LX6, QEMU backend
  | 'esp32-s3'            // Xtensa LX7, QEMU backend
  | 'esp32-c3';           // RISC-V, QEMU backend

export interface BoardInstance {
  id: string;                   // unique in canvas, e.g. 'arduino-uno', 'raspberry-pi-3'
  boardKind: BoardKind;
  x: number;
  y: number;
  running: boolean;
  compiledProgram: string | null;  // hex for AVR/RP2040, null for Pi (runs Python)
  serialOutput: string;
  serialBaudRate: number;
  serialMonitorOpen: boolean;
  activeFileGroupId: string;
}

export const BOARD_KIND_LABELS: Record<BoardKind, string> = {
  'arduino-uno': 'Arduino Uno',
  'arduino-nano': 'Arduino Nano',
  'arduino-mega': 'Arduino Mega 2560',
  'raspberry-pi-pico': 'Raspberry Pi Pico',
  'raspberry-pi-3': 'Raspberry Pi 3B',
  'esp32': 'ESP32 DevKit',
  'esp32-s3': 'ESP32-S3 DevKit',
  'esp32-c3': 'ESP32-C3 DevKit',
};

export const BOARD_KIND_FQBN: Record<BoardKind, string | null> = {
  'arduino-uno': 'arduino:avr:uno',
  'arduino-nano': 'arduino:avr:nano:cpu=atmega328',
  'arduino-mega': 'arduino:avr:mega',
  'raspberry-pi-pico': 'rp2040:rp2040:rpipico',
  'raspberry-pi-3': null,   // compiled/run by QEMU, no arduino-cli
  'esp32': 'esp32:esp32:esp32',
  'esp32-s3': 'esp32:esp32:esp32s3',
  'esp32-c3': 'esp32:esp32:esp32c3',
};
