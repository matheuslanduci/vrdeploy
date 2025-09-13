import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core'
import { pk, timestamps } from '~/util/sql'

export const redeTable = pgTable('rede', {
  id: pk(),
  nome: varchar('nome').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  ...timestamps()
})
