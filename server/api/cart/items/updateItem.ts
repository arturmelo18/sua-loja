import { CartItemSchema } from '~/server/models/cart'
import { ProductSchema } from '~/server/models/product'

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
    const currentItem = await CartItemSchema.findById(cartItemId).lean()

    if (!currentItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Item não encontrado',
      })
    }

    const product = currentItem ? await ProductSchema.findById(currentItem.product).lean() : null
    const variant = product?.variants?.find(item => item.name === currentItem?.variantName)
    
    if (variant && quantity > variant.quantity) {
      throw createError({ statusCode: 400, statusMessage: 'Estoque insuficiente para esta variação' })
    }

    const updatedItem = await CartItemSchema.findByIdAndUpdate(cartItemId, { quantity }, { new: true }).populate('product')

    return updatedItem
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar item',
    })
  }
})