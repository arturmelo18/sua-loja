import { StoreSchema } from '~/server/models/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawStore = String(query.store || '').trim()
  const storeSlug = rawStore.replace(/^@/, '')
  const ownerId = String(query.ownerId || '').trim()

  const filter = storeSlug ? { store: storeSlug } : ownerId ? { ownerId } : {}
  const store = await StoreSchema.findOne(filter).lean()

  return store ?? null
})
