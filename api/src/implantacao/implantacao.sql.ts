import { pgTable, varchar } from 'drizzle-orm/pg-core'
import { implantacaoAgenteStatus } from '~/implantacao-agente/implantacao-agente.sql'
import { fk, pk, timestamps } from '~/util/sql'

export const implantacaoTable = pgTable('implantacao', {
  id: pk(),
  idVersao: fk('id_versao').notNull(),
  status: varchar('status', { enum: implantacaoAgenteStatus }).notNull(),
  ...timestamps()
})
