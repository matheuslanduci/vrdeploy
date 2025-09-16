import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),

  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),

  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),

  REDIS_URL: z.string().optional()
})

export const env = envSchema.parse(process.env)
