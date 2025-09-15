import { defaultStatements } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { userAc } from 'better-auth/plugins/admin/access'

export const permissions = {
  ...defaultStatements,
  rede: ['read', 'create', 'update', 'delete'],
  loja: ['read', 'create', 'update', 'delete'],
  pdv: ['read', 'create', 'update', 'delete'],
  agente: ['read', 'approve', 'disconnect', 'delete'],
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'get',
    'update'
  ]
} as const

export const ac = createAccessControl(permissions)

export const user = ac.newRole({
  ...userAc.statements,
  rede: ['read'],
  loja: ['read'],
  pdv: ['read'],
  agente: ['read'],
  user: [],
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: []
})

export const admin = ac.newRole({
  ...userAc.statements,
  rede: ['read', 'create', 'update', 'delete'],
  loja: ['read', 'create', 'update', 'delete'],
  pdv: ['read', 'create', 'update', 'delete'],
  agente: ['read', 'approve', 'disconnect', 'delete'],
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'get',
    'update'
  ],
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: []
})
