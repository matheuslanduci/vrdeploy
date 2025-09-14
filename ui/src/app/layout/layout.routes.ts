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
  },
  {
    path: 'lojas',
    loadComponent: () =>
      import('../lojas/lojas-consulta/lojas-consulta').then(
        (m) => m.LojasConsulta
      )
  },
  {
    path: 'lojas/cadastro',
    loadComponent: () =>
      import('../lojas/lojas-cadastro/lojas-cadastro').then(
        (m) => m.LojasCadastro
      )
  },
  {
    path: 'lojas/edicao/:id',
    loadComponent: () =>
      import('../lojas/lojas-edicao/lojas-edicao').then((m) => m.LojasEdicao)
  }
]
