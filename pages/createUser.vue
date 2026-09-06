<template>
  <div class="h-screen w-screen flex justify-center items-center bg-cream">
    <div class="modal-box auth-modal-box" style="max-width: 520px;">
      <button class="modal-close-btn" @click="navigateTo('/')">×</button>

      <div class="auth-body">
        <div class="auth-title">Criar Conta</div>
        <div class="auth-sub">Comece sua jornada conosco</div>

        <div class="form-grp">
          <label>Nome completo</label>
          <el-input
            v-model="state.name"
            placeholder="Seu nome"
          />
        </div>

        <div class="form-grp">
          <label>E-mail</label>
          <el-input
            v-model="state.email"
            type="email"
            placeholder="seu@email.com"
          />
        </div>

        <div class="form-grp">
          <label>Senha</label>
          <el-input 
            v-model="state.password"
            :type="!isPasswordHidden ? 'password' : 'text'"
            placeholder="••••••••"
          />
        </div>

        <div class="flex items-center gap-2 mb-4">
          <label for="show-pass" class="text-sm text-gray-600">Visualizar senha</label>
          <el-checkbox
            id="show-pass"
            v-model="isPasswordHidden"
            class="w-4 h-4"
          />
        </div>

        <div class="form-grp">
          <label>CEP</label>
          <el-input 
            v-model="state.zipCode"
            placeholder="00000-000"
            maxlength="9"
            @input="formatZipCode"
            @blur="searchAddress"
          />
        </div>

        <div class="form-grp">
          <label>Estado</label>
          <el-input
            v-model="state.state"
            placeholder="SP"
          />
        </div>

        <div class="form-grp">
          <label>Cidade</label>
          <el-input
            v-model="state.city"
            placeholder="São Paulo"
          />
        </div>

        <div class="form-grp">
          <label>Bairro</label>
          <el-input
            v-model="state.neighborhood"
            placeholder="Centro"
          />
        </div>

        <div class="form-grp">
          <label>Rua</label>
          <el-input
            v-model="state.street"
            placeholder="Rua principal"
          />
        </div>

        <div class="form-grp">
          <label>Número</label>
          <el-input
            v-model="state.number"
            placeholder="123"
          />
        </div>

        <div class="form-grp">
          <label>Complemento (opcional)</label>
          <el-input
            v-model="state.complement"
            placeholder="Apt 101"
          />
        </div>

        <button class="btn btn-dark w-full mb-4" :disabled="isLoading" @click="createUser">
          {{ isLoading ? 'Criando...' : 'Cadastrar' }}
        </button>

        <div class="text-center">
          <span class="text-sm text-gray-600">Já tem conta? </span>
          <nuxt-link to="/" class="text-burgundy font-semibold">Entrar</nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ViaCep } from '~/types/ViaCep'

const state = reactive({
  name: '',
  email: '',
  password: '',
  zipCode: '',
  state: '',
  city: '',
  neighborhood: '',
  street: '',
  number: '',
  complement: '',
})

const isPasswordHidden = ref(false)
const isLoading = ref(false)

const formatZipCode = (value: string) => {
  if (!value) {
    state.zipCode = ''
    return
  }

  let cep = value.replace(/\D/g, '')

  if (cep.length > 8) {
    cep = cep.slice(0, 8)
  }

  cep = cep.replace(/^(\d{5})(\d)/, '$1-$2')

  state.zipCode = cep
}

async function createUser() {
  if (!state.name || !state.email || !state.password || !state.zipCode || !state.state || !state.city || !state.neighborhood || !state.street || !state.number) {
    ElMessage.error('Todos os campos obrigatórios devem ser preenchidos.')
    return
  }

  isLoading.value = true

  try {
    await $fetch('/api/user/createUser', {
      method: 'POST',
      body: {
        name: state.name,
        email: state.email,
        password: state.password,
        zipcode: state.zipCode,
        state: state.state,
        city: state.city,
        neighborhood: state.neighborhood,
        street: state.street,
        number: state.number,
        complement: state.complement,
      },
    })

    ElMessage.success('Usuário criado com sucesso!')

    await navigateTo('/loginPage?next=/storeSettings')
  }
  catch (error: any) {
    ElMessage.error(error.data?.statusMessage || 'Erro ao criar usuário')
    console.error(error)
  }
  finally {
    isLoading.value = false
  }
}

async function searchAddress() {
  const cleanZipCode = state.zipCode.replace(/\D/g, '')

  try {
    const viaCepResponse: ViaCep = await $fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)

    if (viaCepResponse.erro) {
      ElMessage.error('CEP não encontrado')
      return
    }

    state.state = viaCepResponse.uf!
    state.city = viaCepResponse.localidade!
    state.neighborhood = viaCepResponse.bairro!
    state.street = viaCepResponse.logradouro!
  } catch (error) {
    ElMessage.error('Erro ao buscar CEP')
  }
}
</script>

<style scoped>
.bg-cream {
  background: #F2EDE6;
}

el-input {
  width: 100%;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
