import { bigint, serial, timestamp } from 'drizzle-orm/pg-core'

export function pk() {
  return serial('id').primaryKey()
}

export function fk(name: string) {
  return bigint(name, {
    mode: 'number'
  })
}

export function timestamps() {
  return {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull()
  }
}
