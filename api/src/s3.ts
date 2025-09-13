import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env'

export const s3 = new S3Client({
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY
  },
  endpoint: env.S3_ENDPOINT
})
