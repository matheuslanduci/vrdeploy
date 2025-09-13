import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core'
import { fk, pk, timestamps } from '~/util/sql'

export const lojaTable = pgTable('loja', {
  id: pk(),
  idRede: fk('id_rede').notNull(),
  nome: varchar('nome').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  ...timestamps()
})
