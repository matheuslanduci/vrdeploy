import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { randomUUID } from 'node:crypto'
import { Client } from 'pg'

config({
  quiet: true,
  path: '.env.test'
})

const randomId = randomUUID()

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

await client.connect()
await client.query(`create schema if not exists "${randomId}"`)
await client.query(`set search_path to "${randomId}"`)

vi.mock('~/redis', () => ({
  redis: {
    duplicate: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn()
  }
}))

vi.mock('~/s3', () => ({
  s3: {
    send: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('~/pubsub/pubsub', async (original) => {
  const actual = (await original()) as any

  return {
    ...actual,
    subscriber: {
      subscribe: vi.fn()
    },
    publisher: {
      publish: vi.fn()
    }
  }
})

const testDb = drizzle(client as any)

vi.mock('./database', () => ({
  db: testDb
}))

beforeEach(async () => {
  await migrate(testDb, {
    migrationsFolder: './drizzle'
  })
})

beforeEach(async () => {
  await migrate(testDb, {
    migrationsFolder: './drizzle',
    migrationsSchema: randomId
  })
})

afterEach(async () => {
  const tables = [
    '__drizzle_migrations',
    'user',
    'account',
    'session',
    'verification',
    'loja',
    'rede',
    'pdv',
    'agente',
    'versao',
    'implantacao',
    'implantacao_agente'
  ]

  for (const table of tables) {
    await testDb.execute(`drop table if exists "${table}"`)
  }
})

afterAll(async () => {
  await client.query(`drop schema if exists "${randomId}" cascade`)
  await client.end()
})
