import { Routes } from '@angular/router'

export const layoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../home/home').then((m) => m.Home)
  },
  {
    path: 'redes',
    loadComponent: () =>
      import('../redes/redes-consulta/redes-consulta').then(
        (m) => m.RedesConsulta
      )
  },
  {
    path: 'redes/cadastro',
    loadComponent: () =>
      import('../redes/redes-cadastro/redes-cadastro').then(
        (m) => m.RedesCadastro
      )
  },
  {
    path: 'redes/edicao/:id',
    loadComponent: () =>
      import('../redes/redes-edicao/redes-edicao').then((m) => m.RedesEdicao)
  }
]
