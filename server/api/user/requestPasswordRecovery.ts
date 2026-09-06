import { createHash, randomInt } from 'node:crypto'
import { UserSchema } from '~/server/models/user'
import { sendRecoveryEmail } from '~/server/utils/sendRecoveryEmail'

const GENERIC_MESSAGE = 'Se existir uma conta com este e-mail, enviaremos um código de recuperação.'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail válido.' })
  }

  const user = await UserSchema.findOne({ email }).select('+recoveryCodeHash +recoveryCodeExpiresAt +recoveryCodeAttempts')
  if (!user) return { message: GENERIC_MESSAGE }

  const code = String(randomInt(100000, 1000000))
  const codeHash = createHash('sha256').update(code).digest('hex')

  user.recoveryCodeHash = codeHash
  user.recoveryCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  user.recoveryCodeAttempts = 0
  await user.save()

  try {
    await sendRecoveryEmail(email, code)
  } catch (error) {
    user.recoveryCodeHash = undefined
    user.recoveryCodeExpiresAt = undefined
    user.recoveryCodeAttempts = 0
    await user.save()
    throw error
  }

  return { message: GENERIC_MESSAGE }
})
