import { OrderSchema } from '~/server/models/order'
import { CartSchema } from '~/server/models/cart'
import { ProductSchema } from '~/server/models/product'
import { AbacatePayConnector } from '~/server/connectors/AbacatePay/connector'
import { createAbacatePayProduct } from '~/server/helpers/createAbacatePayProduct'

export async function fulfillOrder(externalId: string) {
  const order = await OrderSchema.findOne({ externalId }).populate({
    path: 'items',
    populate: { path: 'product' },
  })

  if (!order) {
    throw new Error('Pedido não encontrado')
  }

  if (order.status === 'PAID') {
    const cart = await CartSchema.findOne({ user: order.user })
    if (cart?.items.length) {
      cart.items = []
      await cart.save()
    }
    return true
  }

  order.status = 'PAID'
  await order.save()

  const items = order.items as any[]
  for (const item of items) {
    const product = await ProductSchema.findById(item.product._id)
    if (!product) continue

    const selectedVariant = product.variants?.find((v: any) => v.name === item.variantName)
    if (selectedVariant) {
      selectedVariant.quantity -= item.quantity
      product.variants = product.variants?.map((v: any) =>
        v.name === selectedVariant.name ? selectedVariant : v
      )
      product.quantity = product.variants?.reduce((total: number, v: any) => total + v.quantity, 0) || 0
    } else {
      product.quantity -= item.quantity
    }

    await product.save()

    if (product.abacatePayId && process.env.NODE_ENV !== 'test') {
      try {
        await AbacatePayConnector.delete('/products/delete', { id: product.abacatePayId })
      } catch (e) {
        // ignore
      }
    }

    try {
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
    } catch (e) {
      // ignore
    }
  }

  const cart = await CartSchema.findOne({ user: order.user })
  if (cart) {
    cart.items = []
    await cart.save()
  }

  return true
}
