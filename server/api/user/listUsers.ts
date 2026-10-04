import { UserSchema } from '~/server/models/user'

export default defineEventHandler(async (event) => {
  const { page = 1, limit = 10 } = getQuery(event)

  const skip = (Number(page) - 1) * Number(limit)

  const [users, total] = await Promise.all([
    UserSchema.find({}, { password: 0 })
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    UserSchema.countDocuments({}),
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