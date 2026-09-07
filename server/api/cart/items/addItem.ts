import { CartSchema, CartItemSchema } from '~/server/models/cart'
import { ProductSchema } from '~/server/models/product'

export default defineEventHandler(async (event) => {
  const { cartId: requestedCartId, userId, productId, quantity, variantName } = await readBody(event)

  if (!userId || !productId || !Number.isInteger(quantity) || quantity < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId, productId e quantity são obrigatórios',
    })
  }

  try {
    const product = await ProductSchema.findById(productId)
    if (!product) {
      throw createError({ statusCode: 404, statusMessage: 'Produto não encontrado' })
    }

    let cart = await CartSchema.findOne({ user: userId })
    if (requestedCartId && cart && String(cart._id) !== String(requestedCartId)) {
      throw createError({ statusCode: 409, statusMessage: 'O carrinho informado não pertence ao usuário' })
    }

    if (!cart) {
      cart = await CartSchema.create({
        user: userId,
        store: product.store,
        items: [],
      })
    }

    const cartId = String(cart._id)

    const variant = product.variants?.find(item => item.name === variantName)
    if (product.variants?.length && (!variant || variant.quantity < quantity)) {
      throw createError({ statusCode: 400, statusMessage: 'Variação ou estoque indisponível' })
    }
    if (!product.variants?.length && product.quantity < quantity) {
      throw createError({ statusCode: 400, statusMessage: 'Estoque insuficiente' })
    }

    const existingItem = await CartItemSchema.findOne({ cartId, product: productId, variantName: variantName || '' })

    if (existingItem) {
      existingItem.quantity += quantity
      existingItem.price = product.price
      await existingItem.save()
      await existingItem.populate('product')
      const updatedCart = await CartSchema.findById(cart._id)
        .populate('user')
        .populate({ path: 'items', populate: { path: 'product' } })
      return { item: existingItem, cart: updatedCart }
    }

    const item = await CartItemSchema.create({
      product: productId,
      quantity,
      cartId,
      price: product.price,
    })

    await CartSchema.findByIdAndUpdate(cart._id, {
      $push: { items: item._id },
    })

    await item.populate('product')
    const updatedCart = await CartSchema.findById(cart._id)
      .populate('user')
      .populate({ path: 'items', populate: { path: 'product' } })
    return { item, cart: updatedCart }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao adicionar item ao carrinho',
    })
  }
})