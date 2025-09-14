import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '~/database'

migrate(db, { migrationsFolder: './drizzle' })
  .then(() => {
    console.log('Migrations applied')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error applying migrations:', err)
  })
