import { Component, OnInit } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzLayoutModule } from 'ng-zorro-antd/layout'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { Auth } from '../service/auth'

@Component({
  selector: 'app-layout',
  imports: [RouterModule, NzIconModule, NzMenuModule, NzLayoutModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}
  ngOnInit(): void {
    if (!this.auth.user()) {
      this.router.navigateByUrl(`/login?returnURL=${this.router.url}`)
      return
    }
  }
}
