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
import { environment } from '../../../environments/environment'
import { Loja } from '../../lojas/lojas-consulta/lojas-consulta'
import { Rede } from '../../redes/redes-consulta/redes-consulta'

@Component({
  selector: 'app-pdv-consulta',
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
  templateUrl: './pdv-consulta.html',
  styleUrl: './pdv-consulta.css'
})
export class PdvConsulta implements OnInit {
  page = 1
  pageSize = 10
  total = 0
  pdvs: PDV[] = []
  loading = false

  totalLojas = 0
  loadedLojas = 0
  pageLojas = 1
  loadingLojas = false
  lojas: Loja[] = []

  totalRedes = 0
  loadedRedes = 0
  pageRedes = 1
  loadingRedes = false
  redes: Rede[] = []

  filtro = {
    idRede: null as number | null,
    idLoja: null as number | null
  }

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  loadData(deletePrev = false) {
    this.loadRedes(1, deletePrev)
    this.loadPdvs()
    this.loadLojas(1, deletePrev)
  }

  loadRedes(page = 1, deletePrev = false) {
    this.loadingRedes = true
    return this.httpClient
      .get<{ data: Rede[]; meta: { total: number } }>(
        `${environment.apiURL}/rede`,
        {
          withCredentials: true,
          params: {
            page
          }
        }
      )
      .subscribe({
        next: (response) => {
          if (deletePrev) {
            this.redes = response.data
          } else {
            this.redes = this.redes.concat(response.data)
          }
          this.totalRedes = response.meta.total
          this.loadedRedes = this.redes.length
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível carregar as redes')
        },
        complete: () => {
          this.loadingRedes = false
        }
      })
  }

  loadNextRedes(): void {
    if (this.redes.length >= this.totalRedes) {
      return
    }

    this.pageRedes++
    this.loadRedes(this.pageRedes)
  }

  loadLojas(page = 1, deletePrev = false) {
    this.loadingLojas = true

    const params: Record<string, any> = {
      page
    }

    if (this.filtro.idRede) {
      params.idRede = this.filtro.idRede
    }

    return this.httpClient
      .get<{ data: Loja[]; meta: { total: number } }>(
        `${environment.apiURL}/loja`,
        {
          withCredentials: true,
          params
        }
      )
      .subscribe({
        next: (response) => {
          if (deletePrev) {
            this.lojas = response.data
          } else {
            this.lojas = this.lojas.concat(response.data)
          }
          this.totalLojas = response.meta.total
          this.loadedLojas = this.lojas.length

          if (
            this.filtro.idLoja &&
            !this.lojas.find((l) => l.id === this.filtro.idLoja)
          ) {
            this.filtro.idLoja = null
          }
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível carregar as lojas')
        },
        complete: () => {
          this.loadingLojas = false
        }
      })
  }

  loadNextLojas(): void {
    if (this.lojas.length >= this.totalLojas) {
      return
    }
    this.pageLojas++
    this.loadLojas(this.pageLojas)
  }

  loadPdvs(): void {
    this.loading = true

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    }

    if (this.filtro.idLoja) {
      params.idLoja = this.filtro.idLoja
    }

    if (this.filtro.idRede) {
      params.idRede = this.filtro.idRede
    }

    this.httpClient
      .get<{
        data: PDV[]
        meta: { total: number; totalPages: number }
      }>(`${environment.apiURL}/pdv`, { withCredentials: true, params })
      .subscribe({
        next: (response) => {
          this.pdvs = response.data
          this.total = response.meta.total
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Não foi possível carregar os PDVs')
        },
        complete: () => {
          this.loading = false
        }
      })
  }

  deletePdv(idPdv: number): void {
    this.httpClient
      .delete(`${environment.apiURL}/pdv/${idPdv}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'PDV excluído com sucesso')
          this.loadPdvs()
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Não foi possível excluir o PDV')
        }
      })
  }
}

export type PDV = {
  loja: Loja
  rede: Rede
  createdAt: Date
  deletedAt: Date | null
  updatedAt: Date
  id: number
  idLoja: number
  nome: string
  ativo: boolean
}
