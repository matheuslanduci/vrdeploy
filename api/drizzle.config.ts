import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://vrdeploy:vrdeploy@localhost:5432/vrdeploy'
  },
  dialect: 'postgresql',
  schema: './src/**/*.sql.ts'
})
