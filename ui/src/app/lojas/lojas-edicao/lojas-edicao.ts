import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { LojasCadastro } from '../lojas-cadastro/lojas-cadastro'

@Component({
  selector: 'app-lojas-edicao',
  imports: [LojasCadastro],
  templateUrl: './lojas-edicao.html',
  styleUrl: './lojas-edicao.css'
})
export class LojasEdicao {
  idLoja: string | null = null

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.idLoja = params['id']
    })
  }
}
