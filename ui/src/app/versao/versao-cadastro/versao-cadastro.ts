import { HttpClient } from '@angular/common/http'
import { Component, Input } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzGridModule } from 'ng-zorro-antd/grid'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzPopconfirmDirective } from 'ng-zorro-antd/popconfirm'
import { NzUploadChangeParam, NzUploadModule } from 'ng-zorro-antd/upload'
import { environment } from '../../../environments/environment'
import { Versao } from '../versao-consulta/versao-consulta'

@Component({
  selector: 'app-versao-cadastro',
  imports: [
    NzIconModule,
    ReactiveFormsModule,
    RouterModule,
    NzButtonModule,
    NzInputModule,
    NzGridModule,
    NzCardModule,
    NzUploadModule,
    NzPopconfirmDirective
  ],
  templateUrl: './versao-cadastro.html',
  styleUrl: './versao-cadastro.css'
})
export class VersaoCadastro {
  @Input() isEdit = false
  @Input() idVersao: string | null = null

  loading = false
  formGroup = new FormGroup({
    semver: new FormControl(''),
    descricao: new FormControl(''),
    manifest: new FormControl('')
  })

  constructor(
    private notification: NzNotificationService,
    private httpClient: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isEdit && this.idVersao) {
      this.loadVersaoData(this.idVersao)
    }
  }

  private loadVersaoData(id: string): void {
    this.loading = true

    this.httpClient
      .get<Versao>(`${environment.apiURL}/versao/${id}`, {
        withCredentials: true
      })
      .subscribe({
        next: (versao) => {
          this.formGroup.patchValue({
            descricao: versao.descricao,
            semver: versao.semver,
            manifest: JSON.stringify(versao.manifest, null, 2)
          })
          this.loading = false
        },
        error: () => {
          this.loading = false
          this.notification.error('Erro', 'Não foi possível carregar a versão.')
        }
      })
  }

  prettifyManifest(): void {
    try {
      const manifest = JSON.parse(this.formGroup.value.manifest || '{}')
      this.formGroup.patchValue({
        manifest: JSON.stringify(manifest, null, 2)
      })
    } catch (error) {
      this.notification.error('Erro', 'Manifesto inválido.')
    }
  }

  submit(): void {
    if (this.isEdit) {
      this.submitEdicao()
    } else {
      this.submitCadastro()
    }
  }

  get uploadUrl(): string {
    return `${environment.apiURL}/versao/${this.idVersao}/upload`
  }

  handleUploadChange(info: NzUploadChangeParam): void {
    if (info.file.status === 'uploading') {
      this.loading = true
    }

    if (info.file.status === 'done') {
      this.loading = false
      this.notification.success('Sucesso', 'Upload realizado com sucesso.')
    } else if (info.file.status === 'error') {
      this.loading = false
      this.notification.error(
        'Erro',
        'O arquivo é inválido. Tente enviar um .zip.'
      )
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

    const payload = {
      ...this.formGroup.value,
      manifest: JSON.parse(this.formGroup.value.manifest || '{}')
    }

    this.httpClient
      .post<Versao>(`${environment.apiURL}/versao`, payload, {
        withCredentials: true
      })
      .subscribe({
        next: (versao) => {
          this.notification.success('Sucesso', 'Versão criada com sucesso.')
          this.router.navigateByUrl(`/versoes/edicao/${versao.id}`)
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Ocorreu um erro ao criar a versão.')
          this.loading = false
        }
      })
  }

  submitEdicao(): void {
    if (this.formGroup.invalid || !this.idVersao) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    this.loading = true

    const payload = {
      ...this.formGroup.value,
      manifest: JSON.parse(this.formGroup.value.manifest || '{}')
    }

    this.httpClient
      .put(`${environment.apiURL}/versao/${this.idVersao}`, payload, {
        withCredentials: true
      })
      .subscribe({
        next: () => {
          this.notification.success('Sucesso', 'Versão editada com sucesso.')
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => {
              this.router.navigateByUrl(`/versoes/edicao/${this.idVersao}`)
            })
        },
        error: (err) => {
          console.error(err)
          this.notification.error('Erro', 'Ocorreu um erro ao editar a versão.')
          this.loading = false
        }
      })
  }
}
