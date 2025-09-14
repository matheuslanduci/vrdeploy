import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzGridModule } from 'ng-zorro-antd/grid'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzTableModule } from 'ng-zorro-antd/table'
import { forkJoin } from 'rxjs'
import { environment } from '../../../environments/environment'
import { Rede } from '../../redes/redes-consulta/redes-consulta'

@Component({
  selector: 'app-lojas-consulta',
  imports: [
    NzButtonModule,
    RouterModule,
    NzIconModule,
    NzTableModule,
    NzPopconfirmModule,
    NzCardModule,
    NzGridModule,
    FormsModule,
    NzSelectModule
  ],
  templateUrl: './lojas-consulta.html',
  styleUrl: './lojas-consulta.css'
})
export class LojasConsulta implements OnInit {
  page = 1
  pageSize = 10
  total = 0
  totalRedes = 0
  loadedRedes = 0
  loadingRedes = false
  loading = false
  lojas: Loja[] = []
  redes: Rede[] = []

  filtro = {
    idRede: null as number | null
  }

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  loadData() {
    this.loading = true
    forkJoin({
      redes: this.loadRedes(),
      lojas: this.loadLojas()
    }).subscribe({
      next: (data) => {
        this.redes = this.redes.concat(data.redes.data)
        this.totalRedes = data.redes.meta.total
        this.lojas = data.lojas.data
        this.total = data.lojas.meta.total
      },
      complete: () => {
        this.loading = false
      },
      error: (err) => {
        console.error(err)
        this.notification.error('Erro', 'Não foi possível carregar os dados')
      }
    })
  }

  loadRedes(page = 1) {
    return this.httpClient.get<{
      meta: { total: number }
      data: Rede[]
    }>(`${environment.apiURL}/rede`, {
      withCredentials: true,
      params: {
        page
      }
    })
  }

  loadNextRedes(): void {
    if (this.redes.length >= this.totalRedes) {
      return
    }

    if (this.loadingRedes) {
      return
    }
    this.loadingRedes = true
    this.loadedRedes++
    this.loadRedes(this.loadedRedes + 1).subscribe({
      next: (data) => {
        this.redes = this.redes.concat(data.data)
        this.totalRedes = data.meta.total
      },
      complete: () => {
        this.loadingRedes = false
      }
    })
  }

  loadLojas() {
    const params: Record<string, any> = {}
    if (this.filtro.idRede) {
      params.idRede = this.filtro.idRede
    }
    return this.httpClient.get<{ meta: { total: number }; data: Loja[] }>(
      `${environment.apiURL}/loja?page=${this.page}&pageSize=${this.pageSize}`,
      {
        withCredentials: true,
        params
      }
    )
  }

  deleteLoja(id: number): void {
    this.httpClient
      .delete(`${environment.apiURL}/loja/${id}`, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Loja deletada com sucesso')
          this.loadData()
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Não foi possível deletar a loja')
        }
      })
  }
}

export type Loja = {
  rede: Rede
  createdAt: Date
  deletedAt: Date | null
  updatedAt: Date
  id: number
  idRede: number
  nome: string
  ativo: boolean
}
