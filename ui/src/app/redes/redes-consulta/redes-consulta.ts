import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { NzTableModule } from 'ng-zorro-antd/table'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-redes-consulta',
  imports: [
    NzButtonModule,
    RouterModule,
    NzIconModule,
    NzTableModule,
    NzPopconfirmModule
  ],
  templateUrl: './redes-consulta.html',
  styleUrl: './redes-consulta.css'
})
export class RedesConsulta {
  page = 1
  pageSize = 10
  total = 0
  redes: Rede[] = []
  loading = false

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.fetchData()
  }

  fetchData(): void {
    this.loading = true

    this.httpClient
      .get<{
        meta: { total: number }
        data: Rede[]
      }>(
        `${environment.apiURL}/rede?page=${this.page}&pageSize=${this.pageSize}`,
        {
          withCredentials: true
        }
      )
      .subscribe({
        next: (response) => {
          this.total = response.meta.total
          this.redes = response.data
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível carregar os dados')
        },
        complete: () => {
          this.loading = false
        }
      })
  }

  deleteRede(id: number): void {
    this.httpClient
      .delete(`${environment.apiURL}/rede/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Rede deletada com sucesso')
          this.fetchData()
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível deletar a rede')
        }
      })
  }
}

export type Rede = {
  createdAt: Date
  deletedAt: Date | null
  updatedAt: Date
  id: number
  nome: string
  ativo: boolean
}
