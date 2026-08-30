import { AbacatePayConnector } from '~/server/connectors/AbacatePay/connector'
import { generateCdnImage } from '~/server/helpers/generateCdnImage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Você deve passar todas as informações para criar um produto',
    })
  }

  const { name, price, quantity, description, active, image } = body

  if (!name || !price || !quantity || !description || !image) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos os campos obrigatórios devem ser preenchidos.',
    })
  }

  if (price < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O preço do produto deve ser positivo.',
    })
  }

  if (price > 1000000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O preço do produto deve ser menor que 1000000.',
    })
  }

  if (quantity < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A quantidade do produto deve ser positiva.',
    })
  }

  if (quantity > 1000000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A quantidade do produto deve ser menor que 1000000',
    })
  }

  const cdnImg = await generateCdnImage(image)

  try {
    const product = await ProductSchema.create({
      name,
      price,
      quantity,
      description,
      active,
      image: cdnImg.url || '',
    })

    const abacateProduct = await AbacatePayConnector.post('/products/create', {
      externalId: product._id.toString(),
      name: product.name,
      price: Math.round(product.price * 100),
      currency: 'BRL',
      description: product.description,
      imageUrl: product.image,
    })

    await ProductSchema.findByIdAndUpdate(product._id, {
      abacatePayId: abacateProduct.data.id,
    })

    const result = {
      status: 'sucesso',
    }

    return result
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar produto no banco de dados' })
  }
})
