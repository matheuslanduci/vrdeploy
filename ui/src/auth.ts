import { createAuthClient } from 'better-auth/client'
import { adminClient } from 'better-auth/client/plugins'
import { environment } from './environments/environment'

export const authClient = createAuthClient({
  baseURL: `${environment.apiURL}/auth`,
  plugins: [adminClient()]
})
