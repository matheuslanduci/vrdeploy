import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzGridModule } from 'ng-zorro-antd/grid'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { environment } from '../../../environments/environment'
import { Versao } from '../../versao/versao-consulta/versao-consulta'

@Component({
  selector: 'app-implantacao-consulta',
  imports: [
    NzButtonModule,
    RouterModule,
    NzIconModule,
    NzTableModule,
    NzPopconfirmModule,
    NzCardModule,
    NzGridModule,
    FormsModule,
    NzSelectModule,
    NzTooltipModule,
    NzTagModule
  ],
  templateUrl: './implantacao-consulta.html',
  styleUrl: './implantacao-consulta.css'
})
export class ImplantacaoConsulta {
  page = 1
  pageSize = 10
  total = 0
  implantacoes: Implantacao[] = []
  loading = false

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  loadData(): void {
    this.loading = true

    this.httpClient
      .get<{
        data: Implantacao[]
        meta: {
          total: number
        }
      }>(
        `${environment.apiURL}/implantacao?page=${this.page}&pageSize=${this.pageSize}`,
        {
          withCredentials: true
        }
      )
      .subscribe({
        next: (response) => {
          this.implantacoes = response.data
          this.total = response.meta.total
        },
        error: (err) => {
          console.error(err)
          this.notification.error(
            'Erro',
            'Ocorreu um erro ao carregar as versões. Tente novamente mais tarde.'
          )
        },
        complete: () => {
          this.loading = false
        }
      })
  }
}

export type Implantacao = {
  createdAt: Date
  deletedAt: Date | null
  updatedAt: Date
  id: number
  idVersao: number
  versao: Versao
  status: 'em_andamento' | 'concluido' | 'falha'
}
