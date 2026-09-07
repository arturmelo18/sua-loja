import { UserSchema } from '~/server/models/user'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || !body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email e senha são obrigatórios.',
    })
  }

  const email = String(body.email).trim().toLowerCase()
  const { password } = body

  const user = await UserSchema.findOne({ email: email })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'E-mail ou senha incorretos.',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password.toString())

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'E-mail ou senha incorretos.',
    })
  }

  return user
})
