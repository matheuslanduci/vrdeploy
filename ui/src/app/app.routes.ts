import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    loadChildren: () =>
      import('./layout/layout.routes').then((m) => m.layoutRoutes)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
]
