<template>
    <div class="page-wrapper-admin" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
        <header class="admin-top-nav">
            <NavBar></NavBar>
        </header>

        <div class="admin-layout-body">
            <main class="admin-main-content">
                <div class="page-header-row">
                    <h2>Minha Conta</h2>
                    <div class="header-actions">
                        <el-button class="btn-secondary" @click="navigateTo('/')">Voltar para a página inicial</el-button>
                    </div>
                </div>

                <el-tabs v-model="activeTab" class="user-dashboard-tabs">
                  <el-tab-pane label="Meus Dados" name="profile">
                    <section class="content-card mt-4">
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

                        <div class="form-column">
                            <span class="column-title">Endereço</span>
                            <div class="form-row">
                                <div class="form-item size-quarter">
                                    <label for="user-zipcode">CEP</label>
                                    <el-input id="user-zipcode" placeholder="00000-000" maxlength="9" v-model="state.zipCode" @input="formatZipCode" @blur="searchAddress"/>
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
                    <div class="flex justify-end mt-4">
                      <el-button class="btn-primary" :disabled="isLoading" @click="handleSaveProfile">
                          {{ isLoading ? 'Salvando...' : 'Salvar Alterações' }}
                      </el-button>
                    </div>
                  </el-tab-pane>

                  <el-tab-pane label="Minha Loja" name="store">
                    <section class="content-card mt-4 flex flex-col items-center justify-center p-12 text-center">
                      <h3 class="text-2xl font-serif text-[var(--store-color)] mb-4">Administre seu Marketplace</h3>
                      <p class="text-gray-600 mb-8 max-w-lg">
                        {{ hasStore ? 'Você já possui uma loja configurada. Acesse as configurações para gerenciar produtos, temas e pedidos.' : 'Crie sua própria loja e comece a vender seus produtos agora mesmo.' }}
                      </p>
                      <el-button class="store-button px-8 py-4 text-lg" @click="navigateTo('/storeSettings')">
                        {{ hasStore ? 'Acessar o Painel da Loja' : 'Criar minha loja agora' }}
                      </el-button>
                    </section>
                  </el-tab-pane>

                  <el-tab-pane label="Explorar Lojas" name="explore">
                    <div class="mt-4" v-loading="loadingStores">
                      <div v-if="stores.length === 0" class="text-center py-12 text-gray-500">
                        Nenhuma loja encontrada no momento.
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" v-else>
                        <div v-for="store in stores" :key="store._id" class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white" @click="navigateTo(`/${store.store}`)">
                          <div class="h-32 w-full flex items-center justify-center bg-cover bg-center" :style="{ backgroundColor: store.color || '#7A1F2E', backgroundImage: store.image ? `url(${store.image})` : 'none' }">
                            <h3 v-if="!store.image" class="text-white text-xl font-serif font-bold tracking-wider">{{ store.name || store.store }}</h3>
                          </div>
                          <div class="store-description" v-if="store.description">
                            <p class="text-sm text-gray-700 line-clamp-2" v-if="store.description">{{ store.description }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
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

const activeTab = ref('profile')
const stores = ref<any[]>([])
const loadingStores = ref(false)
const hasStore = ref(false)

async function checkOwnerStore(userId: string) {
  try {
    const store = await $fetch<{ store: string } | null>('/api/store/getStore', {
      params: { ownerId: userId },
    })
    if (store?.store) {
      hasStore.value = true
    }
  } catch (e) {
    //
  }
}

async function fetchStores() {
  loadingStores.value = true
  try {
    const res: any = await $fetch('/api/store/listStores')
    if (res?.data) {
      stores.value = res.data
    }
  } catch (err) {
    ElMessage.error('Erro ao buscar lojas disponíveis')
  } finally {
    loadingStores.value = false
  }
}

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

    fetchStores()
    checkOwnerStore(user._id)
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

.user-dashboard-tabs {
  margin-top: 1rem;
}

:deep(.el-tabs__item.is-active) {
  color: var(--store-color, #7A1F2E) !important;
}
:deep(.el-tabs__active-bar) {
  background-color: var(--store-color, #7A1F2E) !important;
}
:deep(.el-tabs__item:hover) {
  color: var(--store-color, #7A1F2E) !important;
}

.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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

.store-button {
  background-color: var(--store-color, #7A1F2E) !important;
  border-color: var(--store-color, #7A1F2E) !important;
  color: #fff !important;
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

.store-description {
  display: flex;
  justify-content: center;
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