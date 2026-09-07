export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { productId } = body

    if (!productId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'O identificador do produto deve ser fornecido.',
        })
    }

    try {
        const updatedProduct = await ProductSchema.findByIdAndUpdate(
            productId,
            { active: false, published: false },
            { new: true }
        )

        if (!updatedProduct) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Produto não encontrado para exclusão.',
            })
        }

        return {
            success: true,
            message: 'Produto inativado com sucesso.',
            id: productId
        }

    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('Erro ao inativar o produto:', error.message)

        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno ao inativar o produto no banco de dados.',
        })
    }
})