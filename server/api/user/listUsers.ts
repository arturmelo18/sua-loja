import { UserSchema } from '~/server/models/user'

export default defineEventHandler(async (event) => {
  const { page = 1, limit = 10, store } = getQuery(event)

  const skip = (Number(page) - 1) * Number(limit)

  const filter = store ? { store: String(store).replace(/^@/, '').toLowerCase() } : {}

  const [users, total] = await Promise.all([
    UserSchema.find(filter, { password: 0 })
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    UserSchema.countDocuments(filter),
  ])

  return {
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
  }
})