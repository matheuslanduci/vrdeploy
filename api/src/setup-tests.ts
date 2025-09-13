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

beforeAll(async () => {
  await client.connect()
  await client.query(`create schema if not exists "${randomId}"`)
  await client.query(`set search_path to "${randomId}"`)
})

beforeEach(async () => {
  console.log('Setting up database...')
  const db = drizzle(process.env.DATABASE_URL!)
  await migrate(db, {
    migrationsFolder: './drizzle',
    migrationsSchema: randomId
  })
})

afterEach(async () => {
  console.log('Cleaning up database...')
  const db = drizzle(process.env.DATABASE_URL!)
  const tables = [
    '__drizzle_migrations',
    'user',
    'account',
    'session',
    'verification',
    'rede'
  ]

  for (const table of tables) {
    await db.execute(`drop table if exists "${table}"`)
  }
})

afterAll(async () => {
  // await client.query(`drop schema if exists "${randomId}" cascade`)
  // await client.end()
})
