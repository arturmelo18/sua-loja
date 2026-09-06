import { StoreSchema } from '~/server/models/store'
import { UserSchema } from '~/server/models/user'

export default defineEventHandler(async (event) => {
  const { storeId, approvalStatus } = await readBody(event)

  if (!storeId || !['approved', 'rejected', 'pending'].includes(approvalStatus)) {
    throw createError({ statusCode: 400, statusMessage: 'storeId e approvalStatus são obrigatórios' })
  }

  const approved = approvalStatus === 'approved'
  const store = await StoreSchema.findByIdAndUpdate(
    storeId,
    { approvalStatus, active: approved },
    { new: true }
  ).lean()

  if (!store) throw createError({ statusCode: 404, statusMessage: 'Loja não encontrada' })

  await UserSchema.findByIdAndUpdate(store.ownerId, {
    kind: approved ? 'admin' : 'user',
    store: store.store,
  })

  return store
})
