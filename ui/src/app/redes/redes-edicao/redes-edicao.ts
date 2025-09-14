import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { RedesCadastro } from '../redes-cadastro/redes-cadastro'

@Component({
  selector: 'app-redes-edicao',
  imports: [RedesCadastro],
  templateUrl: './redes-edicao.html',
  styleUrl: './redes-edicao.css'
})
export class RedesEdicao {
  redeId: string | null = null

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.redeId = params['id']
    })
  }
}
