import { UserSchema } from '~/server/models/user'

export default defineEventHandler(async (event) => {
  const { userId, kind } = await readBody(event)

  if (!userId || !kind) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId e kind são obrigatórios',
    })
  }

  if (!['admin', 'user', 'superadmin'].includes(kind)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'kind deve ser "admin", "user" ou "superadmin"',
    })
  }

  const user = await UserSchema.findByIdAndUpdate(
    userId,
    { kind },
    { new: true, select: '-password' }
  )

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  return { status: 'sucesso', user }
})