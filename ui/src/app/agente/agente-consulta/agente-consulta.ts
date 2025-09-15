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
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { environment } from '../../../environments/environment'
import { Loja } from '../../lojas/lojas-consulta/lojas-consulta'
import { PDV } from '../../pdv/pdv-consulta/pdv-consulta'
import { Rede } from '../../redes/redes-consulta/redes-consulta'

@Component({
  selector: 'app-agente-consulta',
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
  templateUrl: './agente-consulta.html',
  styleUrl: './agente-consulta.css'
})
export class AgenteConsulta implements OnInit {
  page = 1
  pageSize = 10
  total = 0
  agentes: Agente[] = []
  loading = false

  totalRedes = 0
  loadedRedes = 0
  pageRedes = 1
  loadingRedes = false
  redes: Rede[] = []

  totalLojas = 0
  loadedLojas = 0
  pageLojas = 1
  loadingLojas = false
  lojas: Loja[] = []

  totalPdvs = 0
  loadedPdvs = 0
  pagePdvs = 1
  loadingPdvs = false
  pdvs: PDV[] = []

  filtro = {
    idRede: null as number | null,
    idLoja: null as number | null,
    idPdv: null as number | null
  }

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  loadData(deletePrev = false) {
    this.loadAgentes()
    this.loadRedes(1, deletePrev)
    this.loadPdvs(1, deletePrev)
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

  loadPdvs(page = 1, deletePrev = false) {
    this.loadingPdvs = true

    const params: Record<string, any> = {
      page
    }

    if (this.filtro.idRede) {
      params.idRede = this.filtro.idRede
    }

    if (this.filtro.idLoja) {
      params.idLoja = this.filtro.idLoja
    }

    this.httpClient
      .get<{ data: PDV[]; meta: { total: number } }>(
        `${environment.apiURL}/pdv`,
        {
          withCredentials: true,
          params
        }
      )
      .subscribe({
        next: (response) => {
          if (deletePrev) {
            this.pdvs = response.data
          } else {
            this.pdvs = this.pdvs.concat(response.data)
          }
          this.totalPdvs = response.meta.total
          this.loadedPdvs = this.pdvs.length
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível carregar os PDVs')
        },
        complete: () => {
          this.loadingPdvs = false
        }
      })
  }

  loadNextPdvs(): void {
    if (this.pdvs.length >= this.totalPdvs) {
      return
    }

    this.pagePdvs++
    this.loadPdvs(this.pagePdvs)
  }

  loadAgentes(): void {
    this.loading = true

    const params: Record<string, any> = {
      page: this.page,
      pageSize: this.pageSize
    }

    if (this.filtro.idRede) {
      params.idRede = this.filtro.idRede
    }

    if (this.filtro.idLoja) {
      params.idLoja = this.filtro.idLoja
    }

    if (this.filtro.idPdv) {
      params.idPdv = this.filtro.idPdv
    }

    this.httpClient
      .get<{ data: Agente[]; meta: { total: number } }>(
        `${environment.apiURL}/agente`,
        {
          withCredentials: true,
          params
        }
      )
      .subscribe({
        next: (response) => {
          this.agentes = response.data
          this.total = response.meta.total
        },
        error: () => {
          this.notification.error(
            'Erro',
            'Não foi possível carregar os agentes'
          )
        },
        complete: () => {
          this.loading = false
        }
      })
  }

  approveAgente(idAgente: number): void {
    this.httpClient
      .patch(
        `${environment.apiURL}/agente/${idAgente}`,
        { situacao: 'aprovado' },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Agente aprovado com sucesso')
          this.loadAgentes()
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível aprovar o agente')
        }
      })
  }

  rejectAgente(idAgente: number): void {
    this.httpClient
      .patch(
        `${environment.apiURL}/agente/${idAgente}`,
        { situacao: 'rejeitado' },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Agente rejeitado com sucesso')
          this.loadAgentes()
        },
        error: () => {
          this.notification.error('Erro', 'Não foi possível rejeitar o agente')
        }
      })
  }
}

export type Agente = {
  id: number
  idPdv: number | null
  enderecoMac: string
  sistemaOperacional: string
  ativo: boolean
  situacao: 'pendente' | 'aprovado' | 'rejeitado'
  online: boolean
  createdAt: Date
  deletedAt: Date | null
  updatedAt: Date
  loja: Loja | null
  rede: Rede | null
  pdv: PDV | null
}
