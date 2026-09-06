import { createHash } from 'node:crypto'
import bcrypt from 'bcrypt'
import { UserSchema } from '~/server/models/user'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const code = String(body?.code || '').trim()
  const password = String(body?.password || '')

  if (!email || !/^\d{6}$/.test(code) || !password) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail, código e nova senha são obrigatórios.' })
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter 8 caracteres, uma letra maiúscula e um caractere especial.' })
  }

  const user = await UserSchema.findOne({ email }).select('+recoveryCodeHash +recoveryCodeExpiresAt +recoveryCodeAttempts')
  if (!user || !user.recoveryCodeHash || !user.recoveryCodeExpiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Código inválido ou expirado.' })
  }

  if (user.recoveryCodeAttempts >= 5 || user.recoveryCodeExpiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Código inválido ou expirado.' })
  }

  const codeHash = createHash('sha256').update(code).digest('hex')
  if (codeHash !== user.recoveryCodeHash) {
    user.recoveryCodeAttempts += 1
    await user.save()
    throw createError({ statusCode: 400, statusMessage: 'Código inválido ou expirado.' })
  }

  user.password = await bcrypt.hash(password, 10)
  user.recoveryCodeHash = undefined
  user.recoveryCodeExpiresAt = undefined
  user.recoveryCodeAttempts = 0
  await user.save()

  return { message: 'Senha alterada com sucesso.' }
})
