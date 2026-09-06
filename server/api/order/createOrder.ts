import { CartSchema } from '~/server/models/cart'
import { OrderSchema } from '~/server/models/order'
import { AbacatePayConnector } from '~/server/connectors/AbacatePay/connector'
import { generateSaleCode } from '~/server/utils/generateSaleCode'

export default defineEventHandler(async (event) => {
  const { cartId, userId, store } = await readBody(event)

  if (!cartId || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'cartId e userId são obrigatórios' })
  }

  const cart = await CartSchema.findById(cartId).populate({
    path: 'items',
    populate: { path: 'product' },
  })

  if (!cart || !cart.items.length) {
    throw createError({ statusCode: 400, statusMessage: 'Carrinho vazio ou não encontrado' })
  }

  const items = cart.items as any[]

  for (const item of items) {
    if (item.product.quantity < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Estoque insuficiente para "${item.product.name}". Disponível: ${item.product.quantity}`,
      })
    }
  }

  const missingAbacatePay = items.filter(i => !i.product.abacatePayId)
  if (missingAbacatePay.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Produtos sem abacatePayId: ${missingAbacatePay.map((i: any) => i.product.name).join(', ')}`,
    })
  }

  const total = items.reduce((acc: number, i: any) => acc + i.product.price * i.quantity, 0)
  const externalId = `order-${userId}-${Date.now()}`
  const saleCode = generateSaleCode()

  const abacateResponse = await AbacatePayConnector.post('/checkouts/create', {
    externalId,
    items: items.map((i: any) => ({
      id: i.product.abacatePayId,
      quantity: i.quantity,
    })),
    ...(process.env.APP_URL && {
      completionUrl: `${process.env.APP_URL}/checkout/success`,
      returnUrl: `${process.env.APP_URL}/cart`,
    }),
  })

  if (!abacateResponse?.data) {
    throw createError({ statusCode: 500, statusMessage: 'Erro ao criar checkout na AbacatePay' })
  }

  const order = await OrderSchema.create({
    user: userId,
    store,
    items: cart.items.map((i: any) => i._id),
    total,
    status: 'PENDING',
    readyForPickup: false,
    saleCode,
    abacatePayCheckoutId: abacateResponse.data.id,
    abacatePayCheckoutUrl: abacateResponse.data.url,
    externalId,
  })

  return {
    orderId: order._id,
    checkoutUrl: abacateResponse.data.url,
  }
})