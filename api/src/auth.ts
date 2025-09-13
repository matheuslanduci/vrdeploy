import { APIError, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthMiddleware } from 'better-auth/api'
import { admin as adminPlugin, defaultStatements } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { userAc } from 'better-auth/plugins/admin/access'
import { createMiddleware } from 'hono/factory'
import { accountTable } from './account/account.sql'
import { db } from './database'
import { sessionTable } from './session/session.sql'
import { userTable } from './user/user.sql'
import { verificationTable } from './verification/verification.sql'

const permissions = {
  ...defaultStatements,
  rede: ['read', 'create', 'update', 'delete'],
  loja: ['read', 'create', 'update', 'delete'],
  pdv: ['read', 'create', 'update', 'delete'],
  agente: ['read', 'approve', 'disconnect'],
  user: ['read', 'create', 'update', 'delete']
} as const

const ac = createAccessControl(permissions)

const user = ac.newRole({
  ...userAc.statements,
  rede: ['read'],
  loja: ['read'],
  pdv: ['read'],
  agente: ['read'],
  user: ['read'],
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: []
})

const admin = ac.newRole({
  ...userAc.statements,
  rede: ['read', 'create', 'update', 'delete'],
  loja: ['read', 'create', 'update', 'delete'],
  pdv: ['read', 'create', 'update', 'delete'],
  agente: ['read', 'approve', 'disconnect'],
  user: ['read', 'create', 'update', 'delete'],
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: []
})

export const auth = betterAuth({
  plugins: [
    adminPlugin({
      ac,
      roles: { user, admin }
    })
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    disableSignUp: true,
    // In tests, the passwords take too long to be hashed
    ...(process.env.NODE_ENV === 'test' && {
      password: {
        hash: (password: string) => Promise.resolve(password),
        verify: ({ password, hash }: { password: string; hash: string }) =>
          Promise.resolve(password === hash)
      }
    })
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: userTable,
      account: accountTable,
      session: sessionTable,
      verification: verificationTable
    }
  }),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return

      if (!ctx.body?.email.endsWith('@vrsoft.com.br')) {
        throw new APIError('BAD_REQUEST', {
          code: 'Forbidden',
          message: 'Você não tem permissão para acessar esta aplicação'
        })
      }
    })
  }
})

export function requireAuth() {
  return createMiddleware<AuthVariables>(async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    })

    if (!session) return c.text('Unauthorized', 401)

    c.set('user', session.user)
    c.set('session', session.session)

    return next()
  })
}

export function requirePermission<T extends keyof typeof permissions>(
  resource: T,
  ...actions: (typeof permissions)[T][number][]
) {
  return createMiddleware<AuthVariables>(async (c, next) => {
    const data = await auth.api.userHasPermission({
      body: {
        userId: c.get('user').id,
        permission: {
          [resource]: actions
        }
      }
    })

    if (!data.success) return c.text('Forbidden', 403)

    return next()
  })
}

type AuthVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user
    session: typeof auth.$Infer.Session.session
  }
}
