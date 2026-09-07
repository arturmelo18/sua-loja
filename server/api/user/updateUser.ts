import { UserSchema } from '~/server/models/user'
import bcrypt from 'bcrypt'
import type { ViaCep } from '~/types/ViaCep'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nenhum dado foi fornecido para atualização.',
    })
  }

  const { id, _id, name, password, zipcode, state, city, neighborhood, street, number, complement } = body
  const email = body.email ? String(body.email).trim().toLowerCase() : undefined
  const userId = id || _id

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O ID do usuário é obrigatório para realizar a atualização.',
    })
  }

  const user = await UserSchema.findById(userId)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuário não encontrado.',
    })
  }

  if (email && email !== user.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'Email inválido.' })
    }

    const existingUser = await UserSchema.findOne({ email })
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Este e-mail já está em uso por outro usuário.',
      })
    }
    user.email = email
  }

  if (password) {
    if (password.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'A senha deve ter no mínimo 8 caracteres.' })
    }
    if (!/[A-Z]/.test(password)) {
      throw createError({ statusCode: 400, statusMessage: 'A senha deve conter pelo menos uma letra maiúscula.' })
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw createError({ statusCode: 400, statusMessage: 'A senha deve conter pelo menos um caractere especial.' })
    }
    
    user.password = await bcrypt.hash(password, 10)
  }

  if (zipcode && zipcode !== user.address?.zipcode) {
    const cleanZipCode = zipcode.replace(/\D/g, '')

    try {
      const viaCepResponse: ViaCep = await $fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)

      if (viaCepResponse.erro) {
        throw createError({
          statusCode: 400,
          statusMessage: 'CEP não encontrado na base de dados.',
        })
      }
      
      user.address.zipcode = zipcode
    }
    catch (error: any) {
      if (error.statusCode) throw error
      throw createError({ statusCode: 500, statusMessage: 'Erro ao validar o CEP' })
    }
  }
   
  if (state) user.address.state = state
  if (city) user.address.city = city
  if (neighborhood) user.address.neighborhood = neighborhood
  if (street) user.address.street = street
  if (number) user.address.number = number
  if (complement !== undefined) user.address.complement = complement


  if (name) user.name = name

  try {
    const updatedUser = await user.save()

    return {
      status: 'sucesso',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    }
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar usuário no banco de dados' })
  }
})