import { boolean, index, pgTable, varchar } from 'drizzle-orm/pg-core'
import { fk, pk, timestamps } from '~/util/sql'

export const pdvTable = pgTable(
  'pdv',
  {
    id: pk(),
    idLoja: fk('id_loja').notNull(),
    nome: varchar('nome').notNull(),
    ativo: boolean('ativo').default(true).notNull(),
    ...timestamps()
  },
  (table) => [index('pdv_id_loja_idx').on(table.idLoja)]
)
