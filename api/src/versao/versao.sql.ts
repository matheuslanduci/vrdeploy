import { jsonb, pgTable, varchar } from 'drizzle-orm/pg-core'
import { pk, timestamps } from '~/util/sql'
import { VersaoManifest } from './versao'

export const versaoTable = pgTable('versao', {
  id: pk(),
  semver: varchar('semver').notNull(),
  descricao: varchar('descricao').notNull(),
  storageKey: varchar('storage_key').notNull(),
  manifest: jsonb('manifest').$type<VersaoManifest>().notNull(),
  ...timestamps()
})
