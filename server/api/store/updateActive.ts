import { StoreSchema } from '~/server/models/store'

export default defineEventHandler(async (event) => {
  const { storeId, active } = await readBody(event)

  if (!storeId || typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'storeId e active são obrigatórios' })
  }

  const store = await StoreSchema.findByIdAndUpdate(
    storeId,
    { active },
    { new: true, select: '-slides' }
  ).lean()

  if (!store) {
    throw createError({ statusCode: 404, statusMessage: 'Loja não encontrada' })
  }

  return store
})
