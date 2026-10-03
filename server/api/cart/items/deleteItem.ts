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
    
    if (error.name === 'ValidationError') {
      throw createError({ statusCode: 400, statusMessage: `Erro de validação: ${error.message}` })
    }
    if (error.code === 11000) {
      throw createError({ statusCode: 409, statusMessage: `Conflito: Registro já existente no banco de dados.` })
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw createError({ statusCode: 401, statusMessage: `Não autorizado: Token inválido ou expirado.` })
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Erro ao remover item do carrinho: ${error.message}`,
    })
  }
})