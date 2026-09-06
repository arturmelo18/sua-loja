<template>
    <div class="page-wrapper-admin" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
        <header class="admin-top-nav">
            <NavBar></NavBar>
        </header>

        <div class="admin-layout-body">
            <main class="admin-main-content">
                <div class="page-header-row">
                    <h2>Gerenciar Cadastro</h2>
                    <div class="header-actions">
                        <el-button class="btn-secondary" @click="navigateTo('/')">Cancelar</el-button>
                        <el-button class="btn-primary" :disabled="isLoading" @click="handleSaveProfile">
                            {{ isLoading ? 'Salvando...' : 'Salvar Alterações' }}
                        </el-button>
                    </div>
                </div>

                <section class="content-card">
                    <!-- Coluna Esquerda -->
                    <div class="form-column">
                        <span class="column-title">Informações Pessoais</span>

                        <div class="form-item">
                            <label for="user-name">Nome Completo</label>
                            <el-input id="user-name" placeholder="Ex: Artur Silva" v-model="state.name"/>
                        </div>

                        <div class="form-item">
                            <label for="user-email">E-mail de Acesso</label>
                            <el-input id="user-email" type="email" placeholder="nome@exemplo.com" v-model="state.email"/>
                        </div>

                        <span class="column-title separation-title">Segurança</span>

                        <div class="form-row">
                            <div class="form-item size-half">
                                <label for="user-password">Nova Senha</label>
                                <el-input id="user-password" type="password" show-password placeholder="••••••••" v-model="state.password"/>
                                <span class="field-hint">Deixe em branco para manter a senha atual</span>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna Direita -->
                    <div class="form-column">
                        <span class="column-title">Endereço</span>

                        <div class="form-row">
                            <div class="form-item size-quarter">
                                <label for="user-zipcode">CEP</label>
                                <el-input
                                    id="user-zipcode"
                                    placeholder="00000-000"
                                    maxlength="9"
                                    v-model="state.zipCode"
                                    @input="formatZipCode"
                                    @blur="searchAddress"
                                />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-item size-small">
                                <label for="user-state">Estado</label>
                                <el-input id="user-state" placeholder="SP" v-model="state.uf"/>
                            </div>
                            <div class="form-item">
                                <label for="user-city">Cidade</label>
                                <el-input id="user-city" placeholder="São Paulo" v-model="state.city"/>
                            </div>
                        </div>

                        <div class="form-item">
                            <label for="user-neighborhood">Bairro</label>
                            <el-input id="user-neighborhood" placeholder="Centro" v-model="state.neighborhood"/>
                        </div>

                        <div class="form-item">
                            <label for="user-street">Rua</label>
                            <el-input id="user-street" placeholder="Rua Principal" v-model="state.street"/>
                        </div>

                        <div class="form-row">
                            <div class="form-item size-small">
                                <label for="user-number">Número</label>
                                <el-input id="user-number" placeholder="123" v-model="state.number"/>
                            </div>
                            <div class="form-item">
                                <label for="user-complement">Complemento <span class="optional-label">(opcional)</span></label>
                                <el-input id="user-complement" placeholder="Apt 101" v-model="state.complement"/>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
        <LofFooter />
    </div>
</template>

<script lang="ts" setup>
import type { User } from '~/types/User'
import type { ViaCep } from '~/types/ViaCep'

const state = reactive({
    _id: '',
    name: '',
    email: '',
    password: '',
    zipCode: '',
    uf: '',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
    complement: '',
})

const authStore = useAuthStore()
const { storeColor, loadStoreTheme } = useStoreTheme()
const isLoading = ref(false)

onMounted(() => {
    const user = authStore.getUser
    if (!user) return

  loadStoreTheme({ ownerId: user._id })

    state._id = user._id
    state.name = user.name
    state.email = user.email
    state.zipCode = user.address?.zipcode ?? ''
    state.uf = user.address?.state ?? ''
    state.city = user.address?.city ?? ''
    state.neighborhood = user.address?.neighborhood ?? ''
    state.street = user.address?.street ?? ''
    state.number = user.address?.number ?? ''
    state.complement = user.address?.complement ?? ''
})

const formatZipCode = (value: string) => {
    if (!value) { state.zipCode = ''; return }
    let cep = value.replace(/\D/g, '').slice(0, 8)
    state.zipCode = cep.replace(/^(\d{5})(\d)/, '$1-$2')
}

async function searchAddress() {
    const clean = state.zipCode.replace(/\D/g, '')
    if (clean.length !== 8) return

    try {
        const res: ViaCep = await $fetch(`https://viacep.com.br/ws/${clean}/json/`)
        if (res.erro) { ElMessage.error('CEP não encontrado'); return }

        state.uf = res.uf          ?? ''
        state.city = res.localidade  ?? ''
        state.neighborhood = res.bairro      ?? ''
        state.street = res.logradouro  ?? ''
    } catch {
        ElMessage.error('Erro ao buscar CEP')
    }
}

async function handleSaveProfile() {
    if (!state.name || !state.email || !state.zipCode || !state.city || !state.neighborhood || !state.street || !state.number) {
        ElMessage.error('Todos os campos obrigatórios devem ser preenchidos.')
        return
    }
    isLoading.value = true
    try {
        await $fetch('/api/user/updateUser', {
            method: 'POST',
            body: {
                _id: state._id,
                name: state.name,
                email: state.email,
                password: state.password || undefined,
                zipcode: state.zipCode,
                state: state.uf,
                city: state.city,
                neighborhood: state.neighborhood,
                street: state.street,
                number: state.number,
                complement: state.complement,
            }
        })
        ElMessage.success('Cadastro atualizado com sucesso!')
    } catch (error: any) {
        ElMessage.error(error.data?.statusMessage || 'Erro ao atualizar o usuário')
        console.error(error)
    } finally {
        isLoading.value = false
    }
}

definePageMeta({ middleware: 'auth' })
</script>

<style lang="css" scoped>

.admin-layout-body {
    margin-bottom: auto;
}

.page-wrapper-admin {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
  background-color: #F2EDE6;
}

.nav-content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.brand-logo {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 24px;
  cursor: pointer;
}

.nav-subtitle {
  font-size: 13px;
  font-weight: 500;
  color: #666666;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.admin-main-content {
  flex: 1;
  padding: 3rem 2rem;
  box-sizing: border-box;
}

.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header-row h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 28px;
  font-weight: 600;
  color: var(--store-color, #7A1F2E);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.content-card {
  display: flex;
  gap: 4rem;
  background-color: #ffffff;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(74, 15, 1, 0.015);
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.column-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--store-color, #7A1F2E);
  margin-bottom: 0.5rem;
  display: block;
  width: 100%;
  border-bottom: 1px solid rgba(74, 15, 1, 0.08);
  padding-bottom: 0.5rem;
}

.separation-title {
  margin-top: 1rem;
}

.form-row {
  display: flex;
  gap: 1.25rem;
}

.size-half {
  flex: 1;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  margin-bottom: 0.5rem;
  color: #555555;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background-color: var(--store-color, #7A1F2E) !important;
  border-color: var(--store-color, #7A1F2E) !important;
  color: #ffffff !important;
  font-weight: 500;
  border-radius: 6px;
  padding: 10px 20px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #631402 !important;
  border-color: #631402 !important;
}

.btn-secondary {
  background-color: transparent !important;
  border-color: rgba(74, 15, 1, 0.2) !important;
  color: var(--store-color, #7A1F2E) !important;
  font-weight: 500;
  border-radius: 6px;
  padding: 10px 20px;
}

.btn-secondary:hover {
  background-color: rgba(74, 15, 1, 0.04) !important;
  border-color: var(--store-color, #7A1F2E) !important;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset !important;
  border-radius: 6px !important;
  padding: 10px 12px;
  background-color: #fcfbfa;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--store-color, #7A1F2E) inset, 0 0 0 3px color-mix(in srgb, var(--store-color, #7A1F2E) 10%, transparent) !important;
  background-color: #ffffff;
}

@media (max-width: 992px) {
  .admin-main-content {
    padding: 1.5rem 1rem;
  }
  .content-card {
    flex-direction: column;
    gap: 2.5rem;
    padding: 2rem;
  }
}
</style>