import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
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
import type { VersaoManifest } from '../../../versao'

@Component({
  selector: 'app-versao-consulta',
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
  templateUrl: './versao-consulta.html',
  styleUrl: './versao-consulta.css'
})
export class VersaoConsulta implements OnInit {
  page = 1
  pageSize = 10
  total = 0
  versoes: Versao[] = []
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
        data: Versao[]
        meta: {
          total: number
        }
      }>(
        `${environment.apiURL}/versao?page=${this.page}&pageSize=${this.pageSize}`,
        {
          withCredentials: true
        }
      )
      .subscribe({
        next: (response) => {
          this.versoes = response.data
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

export type Versao = {
  createdAt: Date
  deletedAt: Date | null
  updatedAt: Date
  id: number
  semver: string
  descricao: string
  storageKey: string
  manifest: VersaoManifest
  filePresent: boolean
}
