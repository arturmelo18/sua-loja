import { CartSchema, CartItemSchema } from '~/server/models/cart'

export default defineEventHandler(async (event) => {
  const { cartItemId, cartId } = getQuery(event)

  if (!cartItemId || !cartId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'cartItemId e cartId são obrigatórios',
    })
  }

  try {
    const item = await CartItemSchema.findByIdAndDelete(cartItemId)

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Item não encontrado',
      })
    }

    await CartSchema.findByIdAndUpdate(cartId, {
      $pull: { items: cartItemId }
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao remover item do carrinho',
    })
  }
})