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
import { forkJoin, Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import { Rede } from '../../redes/redes-consulta/redes-consulta'

@Component({
  selector: 'app-lojas-cadastro',
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
  templateUrl: './lojas-cadastro.html',
  styleUrl: './lojas-cadastro.css'
})
export class LojasCadastro implements OnInit {
  @Input() isEdit = false
  @Input() idLoja: string | null = null

  totalRedes = 0
  loadedRedes = 0
  loadingRedes = false
  redes: Rede[] = []
  loading = false
  formGroup = new FormGroup({
    nome: new FormControl(''),
    idRede: new FormControl<number | null>(null)
  })

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
    const requests: Observable<any>[] = []
    if (this.isEdit && this.idLoja) {
      requests.push(this.loadLojaData(this.idLoja))
    }
    requests.push(this.loadRedes())

    forkJoin(requests).subscribe({
      next: (responses) => {
        if (this.isEdit && this.idLoja) {
          const lojaData = responses[0]
          this.formGroup.patchValue({
            nome: lojaData.nome,
            idRede: lojaData.idRede
          })
        }
        const redesData = responses[responses.length - 1]
        this.redes = redesData.data
        this.totalRedes = redesData.meta.total
      },
      complete: () => {
        this.loading = false
      }
    })
  }

  loadLojaData(lojaId: string): Observable<any> {
    return this.httpClient.get(`${environment.apiURL}/loja/${lojaId}`, {
      withCredentials: true
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

  submitCadastro(): void {
    if (this.formGroup.invalid) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    this.httpClient
      .post(
        `${environment.apiURL}/loja`,
        {
          nome: this.formGroup.value.nome,
          idRede: this.formGroup.value.idRede
        },
        {
          withCredentials: true
        }
      )
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Loja cadastrada com sucesso.')
          this.router.navigate(['/lojas'])
        },
        error: (err) => {
          this.notification.error(
            'Erro',
            'Ocorreu um erro ao cadastrar a loja.'
          )
          this.loading = false
        }
      })
  }

  submitEdicao(): void {
    if (this.formGroup.invalid || !this.idLoja) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    this.loading = true

    this.httpClient
      .put(`${environment.apiURL}/loja/${this.idLoja}`, this.formGroup.value, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Loja editada com sucesso.')
          this.router.navigate(['/lojas'])
        },
        error: (err) => {
          this.notification.error('Erro', 'Ocorreu um erro ao editar a loja.')
          this.loading = false
        }
      })
  }

  submit(): void {
    if (this.isEdit) {
      this.submitEdicao()
    } else {
      this.submitCadastro()
    }
  }
}
