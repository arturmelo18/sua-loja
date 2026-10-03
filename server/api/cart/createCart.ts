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
      store,
      items: [],
    })

    return cart
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
      statusMessage: `Erro ao criar carrinho: ${error.message}`,
    })
  }
})