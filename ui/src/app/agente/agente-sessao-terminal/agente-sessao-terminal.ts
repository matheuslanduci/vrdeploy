import { HttpClient } from '@angular/common/http'
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { environment } from '../../../environments/environment'
import { AttachAddon } from '../../lib/attach-addon'

@Component({
  selector: 'app-agente-sessao-terminal',
  imports: [RouterModule, NzButtonModule, NzSpinModule],
  templateUrl: './agente-sessao-terminal.html',
  styleUrl: './agente-sessao-terminal.css'
})
export class AgenteSessaoTerminal implements OnInit {
  idAgente: number | null = null
  loading = false
  ws: WebSocket | null = null

  @ViewChild('terminalContainer') terminalContainer!: ElementRef

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private notification: NzNotificationService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.idAgente = Number(params.get('id'))
    })
  }

  ngOnInit(): void {
    this.loadData()
  }

  initTerminal() {
    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      cursorBlink: true,
      theme: {
        background: '#282a36',
        foreground: '#f8f8f2',
        cursor: '#f8f8f2',
        black: '#21222c',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff'
      }
    })
    const fit = new FitAddon()
    const clipboard = new ClipboardAddon()
    const attach = new AttachAddon(
      (this.ws = new WebSocket(`${environment.wsURL}/user`)),
      this.idAgente!
    )

    terminal.loadAddon(fit)
    terminal.loadAddon(attach)
    terminal.loadAddon(clipboard)
    terminal.open(this.terminalContainer.nativeElement)
    fit.fit()
  }

  loadData() {
    this.loading = true

    this.httpClient
      .post<{
        sessionId: string
      }>(
        `${environment.apiURL}/sessao-terminal/${this.idAgente}`,
        {},
        {
          withCredentials: true
        }
      )
      .subscribe({
        next: (response) => {
          this.initTerminal()
        },
        complete: () => {
          this.loading = false
        },
        error: (err) => {
          console.error(err)
          this.notification.error(
            'Erro',
            'Não foi possível iniciar a sessão terminal'
          )
        }
      })
  }
}
