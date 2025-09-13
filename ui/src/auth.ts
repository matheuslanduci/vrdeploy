import { ac, admin, user } from '@vrdeploy/shared'
import { createAuthClient } from 'better-auth/client'
import { adminClient } from 'better-auth/client/plugins'
import { environment } from './environments/environment'

export const auth = createAuthClient({
  baseURL: environment.apiURL,
  plugins: [
    adminClient({
      ac,
      roles: { user, admin }
    })
  ]
})
