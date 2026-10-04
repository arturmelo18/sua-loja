import { CartSchema } from '~/server/models/cart'

export default defineEventHandler(async (event) => {
  const { userId } = await readBody(event)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId é obrigatório' })
  }

  const cart = await CartSchema.findOne({ user: userId })
  if (cart) {
    cart.items = []
    await cart.save()
  }

  return { success: true }
})
