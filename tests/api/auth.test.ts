import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

describe('Auth API /api/user', async () => {
  await setup({
    server: true,
  })

  beforeAll(async () => {
    const db = mongoose.connection.db
    if(db) {
      await db.collection('users').deleteMany({})
      
      const hashedPassword = await bcrypt.hash('SenhaForte@123', 10)
      await db.collection('users').insertOne({
        name: 'User Test',
        email: 'test@example.com',
        password: hashedPassword,
        kind: 'user',
        address: {
          zipcode: '01001000',
          state: 'SP',
          city: 'São Paulo',
          neighborhood: 'Sé',
          street: 'Praça da Sé',
          number: '1'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  })

  afterAll(async () => {
    const db = mongoose.connection.db
    if(db) {
      await db.collection('users').deleteMany({})
    }
  })

  it('should authenticate a user with valid credentials', async () => {
    const res = await $fetch('/api/user/authUser', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'SenhaForte@123'
      }
    })
    expect(res).toBeDefined()
    expect(res.email).toBe('test@example.com')
    expect(res.password).toBeUndefined() // Password should not be returned
  })

  it('should fail authentication with invalid password', async () => {
    try {
      await $fetch('/api/user/authUser', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'WrongPassword'
        }
      })
      expect.unreachable('Should have thrown an error')
    } catch (err: any) {
      expect(err.statusCode).toBe(401)
      expect(err.statusMessage).toBe('E-mail ou senha incorretos.')
    }
  })

  it('should fail to create a user if email is already in use', async () => {
    try {
      await $fetch('/api/user/createUser', {
        method: 'POST',
        body: {
          name: 'Another User',
          email: 'test@example.com', // Existing email
          password: 'AnotherPassword@123',
          zipcode: '01001000',
          state: 'SP',
          city: 'São Paulo',
          neighborhood: 'Sé',
          street: 'Praça da Sé',
          number: '1'
        }
      })
      expect.unreachable('Should have thrown an error')
    } catch (err: any) {
      expect(err.statusCode).toBe(409)
      expect(err.statusMessage).toBe('Este e-mail já está em uso.')
    }
  })
})
