import { StoreSchema } from '~/server/models/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawStore = String(query.store || '').trim()
  const storeSlug = rawStore.replace(/^@/, '')
  const ownerId = String(query.ownerId || '').trim()

  const publicApprovalFilter = {
    $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
  }
  const filter = storeSlug
    ? { store: storeSlug, active: { $ne: false }, ...publicApprovalFilter }
    : ownerId
      ? { ownerId }
      : { active: { $ne: false }, ...publicApprovalFilter }
  const store = await StoreSchema.findOne(filter).lean()

  return store ?? null
})
