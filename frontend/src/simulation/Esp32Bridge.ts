/**
 * Esp32Bridge
 *
 * Manages the WebSocket connection from the frontend to the backend
 * QEMU manager for one ESP32/ESP32-S3/ESP32-C3 board instance.
 *
 * Protocol (JSON frames):
 *   Frontend → Backend
 *     { type: 'start_esp32',        data: { board: BoardKind, firmware_b64?: string } }
 *     { type: 'stop_esp32' }
 *     { type: 'load_firmware',      data: { firmware_b64: string } }
 *     { type: 'esp32_serial_input', data: { bytes: number[] } }
 *     { type: 'esp32_gpio_in',      data: { pin: number, state: 0 | 1 } }
 *
 *   Backend → Frontend
 *     { type: 'serial_output', data: { data: string } }
 *     { type: 'gpio_change',   data: { pin: number, state: 0 | 1 } }
 *     { type: 'system',        data: { event: string, ... } }
 *     { type: 'error',         data: { message: string } }
 */

import type { BoardKind } from '../types/board';

const API_BASE = (): string =>
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8001/api';

export class Esp32Bridge {
  readonly boardId: string;
  readonly boardKind: BoardKind;

  // Callbacks wired up by useSimulatorStore
  onSerialData:   ((char: string) => void) | null = null;
  onPinChange:    ((gpioPin: number, state: boolean) => void) | null = null;
  onConnected:    (() => void) | null = null;
  onDisconnected: (() => void) | null = null;
  onError:        ((msg: string) => void) | null = null;
  onSystemEvent:  ((event: string, data: Record<string, unknown>) => void) | null = null;

  private socket: WebSocket | null = null;
  private _connected = false;
  private _pendingFirmware: string | null = null;

  constructor(boardId: string, boardKind: BoardKind) {
    this.boardId   = boardId;
    this.boardKind = boardKind;
  }

  get connected(): boolean {
    return this._connected;
  }

  connect(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;

    const base = API_BASE();
    const wsProtocol = base.startsWith('https') ? 'wss:' : 'ws:';
    const wsUrl = base.replace(/^https?:/, wsProtocol)
      + `/simulation/ws/${encodeURIComponent(this.boardId)}`;

    const socket = new WebSocket(wsUrl);
    this.socket = socket;

    socket.onopen = () => {
      this._connected = true;
      this.onConnected?.();
      // Boot the ESP32 via QEMU, optionally with pre-loaded firmware
      this._send({
        type: 'start_esp32',
        data: {
          board: this.boardKind,
          ...(this._pendingFirmware ? { firmware_b64: this._pendingFirmware } : {}),
        },
      });
    };

    socket.onmessage = (event: MessageEvent) => {
      let msg: { type: string; data: Record<string, unknown> };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'serial_output': {
          const text = (msg.data.data as string) ?? '';
          if (this.onSerialData) {
            for (const ch of text) this.onSerialData(ch);
          }
          break;
        }
        case 'gpio_change': {
          const pin   = msg.data.pin as number;
          const state = (msg.data.state as number) === 1;
          this.onPinChange?.(pin, state);
          break;
        }
        case 'system':
          this.onSystemEvent?.(msg.data.event as string, msg.data);
          break;
        case 'error':
          this.onError?.(msg.data.message as string);
          break;
      }
    };

    socket.onclose = () => {
      this._connected = false;
      this.socket = null;
      this.onDisconnected?.();
    };

    socket.onerror = () => {
      this.onError?.('WebSocket error');
    };
  }

  disconnect(): void {
    if (this.socket) {
      this._send({ type: 'stop_esp32' });
      this.socket.close();
      this.socket = null;
    }
    this._connected = false;
  }

  /**
   * Load a compiled firmware (base64-encoded .bin) into the running ESP32.
   * If not yet connected, the firmware will be sent on next connect().
   */
  loadFirmware(firmwareBase64: string): void {
    this._pendingFirmware = firmwareBase64;
    if (this._connected) {
      this._send({ type: 'load_firmware', data: { firmware_b64: firmwareBase64 } });
    }
  }

  /** Send a byte to the ESP32 UART0 */
  sendSerialByte(byte: number): void {
    this._send({ type: 'esp32_serial_input', data: { bytes: [byte] } });
  }

  /** Send multiple bytes at once */
  sendSerialBytes(bytes: number[]): void {
    if (bytes.length === 0) return;
    this._send({ type: 'esp32_serial_input', data: { bytes } });
  }

  /** Drive a GPIO pin from an external source (e.g. connected Arduino) */
  sendPinEvent(gpioPin: number, state: boolean): void {
    this._send({ type: 'esp32_gpio_in', data: { pin: gpioPin, state: state ? 1 : 0 } });
  }

  private _send(payload: unknown): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }
}
