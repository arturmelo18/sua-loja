import { v2 as cloudinary } from 'cloudinary'

export async function generateCdnImage(img: string): Promise<{ url: string, public_id: string }> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  try {
    const uploadResponse = await cloudinary.uploader.upload(img, {
      folder: 'loja_oficial_fatec',
    })

    if (!uploadResponse?.secure_url || !uploadResponse?.public_id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao processar imagem no CDN.',
      })
    }

    return {
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Erro ao processar imagem no CDN.',
    })
  }
}