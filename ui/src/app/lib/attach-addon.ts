/**
 * Copyright (c) 2014, 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * Implements the attach method, that attaches the terminal to a WebSocket stream.
 */

// Fork do attach do xterm.js para suportar o formato de mensagem customizado
// usado na comunicação com o backend

import type { AttachAddon as IAttachApi } from '@xterm/addon-attach'
import type { IDisposable, ITerminalAddon, Terminal } from '@xterm/xterm'

interface IAttachOptions {
  bidirectional?: boolean
}

function parseXtermString(input: string): string {
  // First, parse as JSON to handle the outer quotes and basic escaping
  const jsonParsed = JSON.parse(input)

  // Replace Unicode escape sequences with actual characters
  const unescaped = jsonParsed.replace(
    /\\u([0-9a-fA-F]{4})/g,
    (match: string, hex: string) => {
      return String.fromCharCode(parseInt(hex, 16))
    }
  )

  return unescaped
}

export class AttachAddon implements ITerminalAddon, IAttachApi {
  private _socket: WebSocket
  private _bidirectional: boolean
  private _disposables: IDisposable[] = []

  constructor(
    socket: WebSocket,
    readonly idAgente: number,
    options?: IAttachOptions
  ) {
    this._socket = socket
    // always set binary type to arraybuffer, we do not handle blobs
    this._socket.binaryType = 'arraybuffer'
    this._bidirectional = !(options && options.bidirectional === false)
  }

  public activate(terminal: Terminal): void {
    this._disposables.push(
      addSocketListener(this._socket, 'open', () => {
        this._socket.send(
          JSON.stringify({
            type: 'subscribe',
            event: 'pty:output',
            data: {
              idAgente: this.idAgente
            }
          })
        )
      })
    )
    this._disposables.push(
      addSocketListener(this._socket, 'message', (ev) => {
        console.log('Message received from server', ev.data)
        const validatedValue = JSON.parse(
          typeof ev.data === 'string'
            ? ev.data
            : new TextDecoder().decode(ev.data)
        ) as {
          type: 'event'
          event: 'pty:output'
          data: string // base64
        }

        const data = validatedValue.data

        terminal.write(
          typeof data === 'string'
            ? parseXtermString(data)
            : new Uint8Array(data)
        )
      })
    )

    if (this._bidirectional) {
      this._disposables.push(terminal.onData((data) => this._sendData(data)))
      this._disposables.push(
        terminal.onBinary((data) => this._sendBinary(data))
      )
    }

    this._disposables.push(
      addSocketListener(this._socket, 'close', () => this.dispose())
    )
    this._disposables.push(
      addSocketListener(this._socket, 'error', () => this.dispose())
    )
  }

  public dispose(): void {
    for (const d of this._disposables) {
      d.dispose()
    }
  }

  private _sendData(data: string): void {
    if (!this._checkOpenSocket()) {
      return
    }
    this._socket.send(
      JSON.stringify({
        type: 'publish',
        event: 'pty:input',
        data: {
          idAgente: this.idAgente,
          input: data
        }
      })
    )
  }

  private _sendBinary(data: string): void {
    if (!this._checkOpenSocket()) {
      return
    }
    const buffer = new Uint8Array(data.length)
    for (let i = 0; i < data.length; ++i) {
      buffer[i] = data.charCodeAt(i) & 255
    }
    this._socket.send(buffer)
  }

  private _checkOpenSocket(): boolean {
    switch (this._socket.readyState) {
      case WebSocket.OPEN:
        return true
      case WebSocket.CONNECTING:
        throw new Error('Attach addon was loaded before socket was open')
      case WebSocket.CLOSING:
        console.warn('Attach addon socket is closing')
        return false
      case WebSocket.CLOSED:
        throw new Error('Attach addon socket is closed')
      default:
        throw new Error('Unexpected socket state')
    }
  }
}

function addSocketListener<K extends keyof WebSocketEventMap>(
  socket: WebSocket,
  type: K,
  handler: (this: WebSocket, ev: WebSocketEventMap[K]) => any
): IDisposable {
  socket.addEventListener(type, handler)
  return {
    dispose: () => {
      if (!handler) {
        // Already disposed
        return
      }
      socket.removeEventListener(type, handler)
    }
  }
}
