import type { App } from '@vrdeploy/api'
import { hc } from 'hono/client'
import { environment } from './environments/environment'

export const api = hc<App>(environment.apiURL)
