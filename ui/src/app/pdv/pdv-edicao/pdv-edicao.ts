import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PdvCadastro } from '../pdv-cadastro/pdv-cadastro'

@Component({
  selector: 'app-pdv-edicao',
  imports: [PdvCadastro],
  templateUrl: './pdv-edicao.html',
  styleUrl: './pdv-edicao.css'
})
export class PdvEdicao {
  idPdv: string | null = null

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.idPdv = params['id']
    })
  }
}
