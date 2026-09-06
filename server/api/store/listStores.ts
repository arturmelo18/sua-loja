import { StoreSchema } from '~/server/models/store'
import { UserSchema } from '~/server/models/user'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 100)
  const page = Math.max(Number(query.page) || 1, 1)
  const skip = (page - 1) * limit

  const [stores, total] = await Promise.all([
    StoreSchema.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    StoreSchema.countDocuments(),
  ])

  const ownerIds = stores.map(store => store.ownerId)
  const owners = await UserSchema.find(
    { _id: { $in: ownerIds } },
    { name: 1, email: 1, kind: 1 }
  ).lean()
  const ownerMap = new Map(owners.map(owner => [String(owner._id), owner]))

  return {
    data: stores.map(store => ({
      ...store,
      owner: ownerMap.get(String(store.ownerId)) ?? null,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
