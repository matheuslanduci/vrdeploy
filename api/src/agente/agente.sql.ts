import { boolean, char, pgTable, varchar } from 'drizzle-orm/pg-core'
import { fk, pk, timestamps } from '~/util/sql'

export const agenteSituacaoEnum = ['pendente', 'aprovado', 'rejeitado'] as const

export const agenteTable = pgTable('agente', {
  id: pk(),
  idPdv: fk('id_pdv'),
  enderecoMac: char('endereco_mac', { length: 17 }).notNull(),
  sistemaOperacional: varchar('sistema_operacional').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  situacao: varchar('situacao', {
    enum: agenteSituacaoEnum
  }).notNull(),
  chaveSecreta: char('chave_secreta', { length: 48 }).notNull(),
  ...timestamps()
})

export type Agente = typeof agenteTable.$inferSelect
