import { HttpClient } from '@angular/common/http'
import { Component, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzGridModule } from 'ng-zorro-antd/grid'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { environment } from '../../../environments/environment'
import { Loja } from '../../lojas/lojas-consulta/lojas-consulta'

@Component({
  selector: 'app-pdv-cadastro',
  imports: [
    NzIconModule,
    ReactiveFormsModule,
    RouterModule,
    NzButtonModule,
    NzInputModule,
    NzGridModule,
    NzCardModule,
    NzSelectModule
  ],
  templateUrl: './pdv-cadastro.html',
  styleUrl: './pdv-cadastro.css'
})
export class PdvCadastro implements OnInit {
  @Input() isEdit = false
  @Input() idPdv: string | null = null

  loading = false

  totalLojas = 0
  loadedLojas = 0
  loadingLojas = false
  pageLojas = 1
  lojas: Loja[] = []

  formGroup = new FormGroup({
    nome: new FormControl(''),
    idLoja: new FormControl<number | null>(null)
  })

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  loadData() {
    this.loadPdv()
    this.loadLojas()
  }

  loadPdv() {
    if (!this.isEdit || !this.idPdv) {
      return
    }

    this.loading = true
    this.httpClient
      .get<any>(`${environment.apiURL}/pdv/${this.idPdv}`, {
        withCredentials: true
      })
      .subscribe({
        next: (data) => {
          this.formGroup.patchValue(data)
          this.loading = false
        },
        error: () => {
          this.loading = false
        }
      })
  }

  loadLojas(page = 1) {
    this.loadingLojas = true

    const params: Record<string, any> = {
      page
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
          this.lojas = this.lojas.concat(response.data)
          this.totalLojas = response.meta.total
          this.loadedLojas = this.lojas.length
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

  submitCadastro(): void {
    if (this.formGroup.invalid) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    this.loading = true
    this.httpClient
      .post(`${environment.apiURL}/pdv`, this.formGroup.value, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'PDV cadastrado com sucesso')
          this.router.navigate(['/pdvs'])
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Não foi possível cadastrar o PDV')
        },
        complete: () => {
          this.loading = false
        }
      })
  }

  submitEdicao(): void {
    if (this.formGroup.invalid) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    this.loading = true
    this.httpClient
      .put(`${environment.apiURL}/pdv/${this.idPdv}`, this.formGroup.value, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'PDV editado com sucesso')
          this.router.navigate(['/pdvs'])
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Não foi possível editar o PDV')
        },
        complete: () => {
          this.loading = false
        }
      })
  }

  submit() {
    if (this.isEdit) {
      this.submitEdicao()
    } else {
      this.submitCadastro()
    }
  }
}
