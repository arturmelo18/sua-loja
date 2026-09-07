import { CartSchema } from '~/server/models/cart'

export default defineEventHandler(async (event) => {
  const { userId, store } = await readBody(event)
  if (!userId || !store) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId e store são obrigatórios para criar um carrinho',
    })
  }
  try {
    const existingCart = await CartSchema.findOne({ user: userId })
    
    if (existingCart) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Este usuário já possui um carrinho',
      })
    }

    const cart = await CartSchema.create({
      user: userId,
      items: [],
    })

    return cart
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar carrinho',
    })
  }
})