import { UserSchema } from '~/server/models/user'
import bcrypt from 'bcrypt'
import type { ViaCep } from '~/types/ViaCep'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Você deve passar todas as informações para criar um usuário',
    })
  }

  const { name, email, password, zipcode, state, city, neighborhood, street, number, complement, store } = body

  if (!name || !email || !password || !zipcode || !state || !city || !neighborhood || !street || !number) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos os campos obrigatórios devem ser preenchidos.',
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email inválido.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter no mínimo 8 caracteres.' })
  }
  if (!/[A-Z]/.test(password)) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve conter pelo menos uma letra maiúscula.' })
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve conter pelo menos um caractere especial.' })
  }

  const existingUser = await UserSchema.findOne({ email })
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Este e-mail já está em uso.',
    })
  }

  const cleanZipCode = zipcode.replace(/\D/g, '')

  try {
    const viaCepResponse: ViaCep = await $fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)

    if (viaCepResponse.erro) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CEP não encontrado na base de dados.',
      })
    }
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao validar o CEP' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const address = {
    zipcode,
    state,
    city,
    neighborhood,
    street,
    number,
    complement: complement ? complement : '',
  }

  try {
    return await UserSchema.create({
      name,
      store,
      email,
      password: hashedPassword,
      // TODO: mudar isso quando a tela de administrador for criada
      kind: 'user',
      address,
    })
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar usuário no banco de dados' })
  }
})
