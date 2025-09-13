import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import { Client } from 'pg'

config({
  quiet: true,
  path: '.env.test'
})

const randomId = randomUUID()

process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
  'TEST_ID',
  randomId
)

const client = new Client({
  connectionString: process.env.DATABASE_URL?.replace(`/${randomId}`, ''),
  database: 'postgres'
})

beforeAll(async () => {
  await client.connect()
  await client.query(`create database "${randomId}"`)
})

afterAll(async () => {
  await client.query(`drop database if exists "${randomId}"`)
  await client.end()
})
