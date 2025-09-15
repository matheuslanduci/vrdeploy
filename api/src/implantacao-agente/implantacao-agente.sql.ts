import { pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { fk, timestamps } from '~/util/sql'

export const implantacaoAgenteStatus = [
  'em_andamento',
  'concluido',
  'falha'
] as const

export const implantacaoAgenteTable = pgTable(
  'implantacao_agente',
  {
    idImplantacao: fk('id_implantacao').notNull(),
    idAgente: fk('id_agente').notNull(),
    status: varchar('status', { enum: implantacaoAgenteStatus }).notNull(),
    ...timestamps()
  },
  (table) => [primaryKey({ columns: [table.idImplantacao, table.idAgente] })]
)
