import bcrypt from 'bcrypt'
import { UserSchema } from '~/server/models/user'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const email = String(config.superAdminEmail || '').trim().toLowerCase()
  const password = String(config.superAdminPassword || '')
  const name = String(config.superAdminName || 'Super administrador').trim()

  if (!email || !password) return

  const existingUser = await UserSchema.findOne({ email })
  if (existingUser) {
    if (existingUser.kind !== 'superadmin') {
      await UserSchema.findByIdAndUpdate(existingUser._id, { kind: 'superadmin' })
    }
    return
  }

  await UserSchema.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    kind: 'superadmin',
    address: {
      zipcode: '00000-000',
      state: '',
      city: '',
      neighborhood: '',
      street: '',
      number: 'S/N',
      complement: '',
    },
  })
})
