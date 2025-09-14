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
import { environment } from '../../../environments/environment'
import { Rede } from '../redes-consulta/redes-consulta'

@Component({
  selector: 'app-redes-cadastro',
  imports: [
    NzIconModule,
    ReactiveFormsModule,
    RouterModule,
    NzButtonModule,
    NzInputModule,
    NzGridModule,
    NzCardModule
  ],
  templateUrl: './redes-cadastro.html',
  styleUrl: './redes-cadastro.css'
})
export class RedesCadastro implements OnInit {
  @Input() isEdit = false
  @Input() idRede: string | null = null
  loading = false

  formGroup = new FormGroup({
    nome: new FormControl('')
  })

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isEdit && this.idRede) {
      this.loadRedeData(this.idRede)
    }
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
      .post(`${environment.apiURL}/rede`, this.formGroup.value, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Rede cadastrada com sucesso.')
          this.router.navigate(['/redes'])
        },
        error: (err) => {
          this.notification.error(
            'Erro',
            'Ocorreu um erro ao cadastrar a rede.'
          )
          this.loading = false
        }
      })
  }

  submitEdicao(): void {
    if (this.formGroup.invalid || !this.idRede) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    this.loading = true

    this.httpClient
      .put(`${environment.apiURL}/rede/${this.idRede}`, this.formGroup.value, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Rede editada com sucesso.')
          this.router.navigate(['/redes'])
        },
        error: (err) => {
          this.notification.error('Erro', 'Ocorreu um erro ao editar a rede.')
          this.loading = false
        }
      })
  }

  private loadRedeData(id: string): void {
    this.httpClient
      .get<Rede>(`${environment.apiURL}/rede/${id}`, {
        withCredentials: true
      })
      .subscribe({
        next: (data) => {
          this.formGroup.patchValue({
            nome: data.nome
          })
        },
        error: (err) => {
          this.notification.error(
            'Erro',
            'Ocorreu um erro ao carregar os dados da rede.'
          )
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
