import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { VersaoCadastro } from '../versao-cadastro/versao-cadastro'

@Component({
  selector: 'app-versao-edicao',
  imports: [VersaoCadastro],
  templateUrl: './versao-edicao.html',
  styleUrl: './versao-edicao.css'
})
export class VersaoEdicao {
  idVersao: string | null = null

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.idVersao = params['id']
    })
  }
}
