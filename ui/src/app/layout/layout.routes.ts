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
  },
  {
    path: 'pdvs',
    loadComponent: () =>
      import('../pdv/pdv-consulta/pdv-consulta').then((m) => m.PdvConsulta)
  },
  {
    path: 'pdvs/cadastro',
    loadComponent: () =>
      import('../pdv/pdv-cadastro/pdv-cadastro').then((m) => m.PdvCadastro)
  },
  {
    path: 'pdvs/edicao/:id',
    loadComponent: () =>
      import('../pdv/pdv-edicao/pdv-edicao').then((m) => m.PdvEdicao)
  },
  {
    path: 'agentes',
    loadComponent: () =>
      import('../agente/agente-consulta/agente-consulta').then(
        (m) => m.AgenteConsulta
      )
  },
  {
    path: 'agentes/:id/sessao',
    loadComponent: () =>
      import('../agente/agente-sessao-terminal/agente-sessao-terminal').then(
        (m) => m.AgenteSessaoTerminal
      )
  },
  {
    path: 'versoes',
    loadComponent: () =>
      import('../versao/versao-consulta/versao-consulta').then(
        (m) => m.VersaoConsulta
      )
  },
  {
    path: 'versoes/cadastro',
    loadComponent: () =>
      import('../versao/versao-cadastro/versao-cadastro').then(
        (m) => m.VersaoCadastro
      )
  },
  {
    path: 'versoes/edicao/:id',
    loadComponent: () =>
      import('../versao/versao-edicao/versao-edicao').then(
        (m) => m.VersaoEdicao
      )
  }
]
