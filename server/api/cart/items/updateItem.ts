import { CartItemSchema } from '~/server/models/cart'

export default defineEventHandler(async (event) => {
  const { cartItemId, quantity } = await readBody(event)

  if (!cartItemId || !Number.isInteger(quantity)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'cartItemId e quantity são obrigatórios',
    })
  }

  if (quantity < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Quantidade deve ser maior que zero',
    })
  }

  try {
    const currentItem = await CartItemSchema.findById(cartItemId).populate('product')

    if (!currentItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Item não encontrado',
      })
    }

    const product = currentItem.product as any
    const variant = product?.variants?.find((item: any) => item.name === currentItem.variantName)
    if (variant && quantity > variant.quantity) {
      throw createError({ statusCode: 400, statusMessage: 'Estoque insuficiente para esta variação' })
    }
    if (!variant && product && quantity > product.quantity) {
      throw createError({ statusCode: 400, statusMessage: 'Estoque insuficiente' })
    }

    currentItem.quantity = quantity
    await currentItem.save()

    return currentItem
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar item',
    })
  }
})