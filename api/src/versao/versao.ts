import z from 'zod'

export const readyTypeGrep = z.object({
  type: z.literal('grep'),
  expr: z.string()
})

export const readyTypeTimeout = z.object({
  type: z.literal('timeout'),
  seconds: z.number().min(1)
})

export const readyTypeHttp = z.object({
  type: z.literal('http'),
  url: z.url(),
  status: z.number().min(100).max(599).optional()
})

export const readyTypeCompleted = z.object({
  type: z.literal('completed')
})

export const dependencySchema = z.object({
  path: z.string(),
  ready: z.union([
    readyTypeGrep,
    readyTypeTimeout,
    readyTypeHttp,
    readyTypeCompleted
  ]),
  get dependencies() {
    return z.array(dependencySchema).optional().default([])
  }
})

export const versaoManifestSchema = z.object({
  version: z.string(),
  dependencies: z.array(dependencySchema).optional().default([])
})

export type VersaoManifest = z.infer<typeof versaoManifestSchema>
