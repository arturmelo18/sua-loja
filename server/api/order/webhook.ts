import { OrderSchema } from '~/server/models/order'
import { CartSchema } from '~/server/models/cart'
import { ProductSchema } from '~/server/models/product'
import { AbacatePayConnector } from '~/server/connectors/AbacatePay/connector'
import { createAbacatePayProduct } from '~/server/helpers/createAbacatePayProduct'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.event !== 'checkout.completed') {
    return { received: true }
  }

  const { externalId } = body.data.checkout

  const order = await OrderSchema.findOne({ externalId }).populate({
    path: 'items',
    populate: { path: 'product' },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })
  }

  if (order.status === 'PAID') {
    const cart = await CartSchema.findOne({ user: order.user })
    if (cart?.items.length) {
      cart.items = []
      await cart.save()
    }
    return { received: true }
  }

  order.status = 'PAID'
  await order.save()
  const items = order.items as any[]
  for (const item of items) {
    const product = await ProductSchema.findById(item.product._id)
    if (!product) continue

    const selectedVariant = product.variants?.find(variant => variant.name === item.variantName)
    if (selectedVariant) {
      selectedVariant.quantity -= item.quantity
      product.variants = product.variants?.map(variant =>
        variant.name === selectedVariant.name ? selectedVariant : variant
      )
      product.quantity = product.variants?.reduce((total, variant) => total + variant.quantity, 0) || 0
    } else {
      product.quantity -= item.quantity
    }

    await product.save()

    if (product.abacatePayId) {
      await AbacatePayConnector.delete('/products/delete', {
        id: product.abacatePayId,
      })
    }

    const abacateProduct = await createAbacatePayProduct({
      externalId: product._id.toString(),
      name: product.name,
      price: Math.round(product.price * 100),
      description: product.description,
      imageUrl: product.image,
    })

    await ProductSchema.findByIdAndUpdate(product._id, {
      abacatePayId: abacateProduct.data.id,
    })
  }
  const cart = await CartSchema.findOne({ user: order.user })
  if (cart) {
    cart.items = []
    await cart.save()
  }

  return { received: true }
})