import { CartSchema } from '~/server/models/cart'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)
  const { userId, cartId } = query

  if (!userId && !cartId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId ou cartId é obrigatório para atualizar o carrinho',
    })
  }

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Corpo da requisição não pode estar vazio',
    })
  }

  try {
    const filter = userId ? { user: userId } : { _id: cartId }
    const cart = await CartSchema.findOneAndUpdate(
      filter,
      { items: body.items },
      { new: true }
    ).populate('user').populate('items.product')

    if (!cart) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Carrinho não encontrado',
      })
    }

    return {
      statusCode: 200,
      message: 'Carrinho atualizado com sucesso',
      cart,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar carrinho',
    })
  }
})
