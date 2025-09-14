import { Component, OnInit } from '@angular/core'
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms'
import { Router } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { from } from 'rxjs'
import { authClient } from '../../auth'
import { Auth } from '../service/auth'

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NzInputModule,
    NzCardModule,
    NzIconModule,
    NzButtonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  formGroup = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern('^[a-zA-Z0-9._%+-]+@vrsoft\\.com\\.br$')
    ]),
    password: new FormControl('', [Validators.required])
  })
  passwordVisible = false

  constructor(
    private auth: Auth,
    private notification: NzNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.user()) {
      this.router.navigateByUrl('/')
      return
    }
  }

  submit(): void {
    if (this.formGroup.invalid) {
      this.notification.error(
        'Erro',
        'Por favor, preencha o formulário corretamente.'
      )
      return
    }

    from(
      authClient.signIn.email({
        email: this.formGroup.value.email ?? '',
        password: this.formGroup.value.password ?? ''
      })
    ).subscribe({
      next: ({ error }) => {
        if (error) {
          this.notification.error(
            'Erro',
            error.message || 'Erro ao fazer login.'
          )

          return
        }

        this.auth.fetchUser()

        const returnURL =
          new URLSearchParams(window.location.search).get('returnURL') || '/'
        this.router.navigateByUrl(returnURL)
      },
      error: (err) => {
        console.error('Unexpected error during sign-in:', err)
        this.notification.error('Erro', 'Erro inesperado ao fazer login.')
      }
    })
  }
}
