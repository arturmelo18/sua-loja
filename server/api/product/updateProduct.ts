import { generateCdnImage } from '~/server/helpers/generateCdnImage'
import { AbacatePayConnector } from '~/server/connectors/AbacatePay/connector'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || !body._id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do produto é obrigatório para atualização.',
    })
  }

  const { _id, name, price, quantity, description, image, published, active } = body

  if (price !== undefined && price < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Preço deve ser positivo.' })
  }

  if (quantity !== undefined && quantity < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Quantidade deve ser positiva.' })
  }

  try {
    const existingProduct = await ProductSchema.findById(_id)
    if (!existingProduct) {
      throw createError({ statusCode: 404, statusMessage: 'Produto não encontrado.' })
    }

    let finalImageUrl = existingProduct.image
    if (image && image !== existingProduct.image) {
      const cdnImg = await generateCdnImage(image)
      finalImageUrl = cdnImg.url || ''
    }

    const updatedProduct = await ProductSchema.findByIdAndUpdate(
      _id,
      {
        name: name ?? existingProduct.name,
        price: price ?? existingProduct.price,
        quantity: quantity ?? existingProduct.quantity,
        description: description ?? existingProduct.description,
        image: finalImageUrl,
        published: published ?? existingProduct.published,
        active: active ?? existingProduct.active,
      },
      { new: true }
    )

    if (existingProduct.abacatePayId) {
      await AbacatePayConnector.delete('/products/delete', {
        id: existingProduct.abacatePayId,
      })
    }

    const abacateProduct = await AbacatePayConnector.post('/products/create', {
      externalId: updatedProduct!._id.toString(),
      name: updatedProduct!.name,
      price: Math.round(updatedProduct!.price * 100), // centavos
      currency: 'BRL',
      description: updatedProduct!.description,
      imageUrl: updatedProduct!.image,
    })

    await ProductSchema.findByIdAndUpdate(_id, {
      abacatePayId: abacateProduct.data.id,
    })

    return { status: 'sucesso' }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar produto',
    })
  }
})