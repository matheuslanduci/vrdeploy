import { Component, OnInit, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { Auth } from './service/auth'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NzSpinModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('VRDeploy')

  constructor(readonly auth: Auth) {}

  ngOnInit(): void {
    this.auth.fetchUser()
  }
}
