<template>
  <div class="super-page">
    <nav-bar />

    <main class="super-shell">
      <header class="super-header">
        <div>
          <p class="eyebrow">Controle da plataforma</p>
          <h1>Painel do superadmin</h1>
          <p>Visualize e administre todas as lojas, usuários, produtos e pedidos.</p>
        </div>
        <button class="logout-button" type="button" @click="logout">Sair</button>
      </header>

      <div class="toolbar">
        <label>
          <span>Filtrar por loja</span>
          <select v-model="selectedStore" @change="refreshCurrentSection">
            <option value="">Todas as lojas</option>
            <option v-for="store in stores" :key="store._id" :value="store.store">
              {{ store.name }} (/{{ store.store }})
            </option>
          </select>
        </label>
        <div class="tabs" role="tablist">
          <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: section === tab.id }" @click="changeSection(tab.id)">
            {{ tab.label }}
          </button>
        </div>
      </div>

      <section v-if="section === 'stores'" class="panel">
        <div class="panel-heading"><h2>Lojas</h2><span>{{ stores.length }} carregadas</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Loja</th><th>Responsável</th><th>URL</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              <tr v-for="store in stores" :key="store._id" :style="{ '--row-color': store.color || '#7A1F2E' }">
                <td><strong class="store-name"><i></i>{{ store.name }}</strong></td>
                <td><span>{{ store.owner?.name || 'Sem responsável' }}</span><small>{{ store.owner?.email || '-' }}</small></td>
                <td>/{{ store.store }}</td>
                <td><span :class="['status', store.active === false ? 'inactive' : 'active']">{{ store.active === false ? 'Inativa' : 'Ativa' }}</span></td>
                <td><button class="row-action" type="button" @click="toggleStore(store)">{{ store.active === false ? 'Ativar' : 'Desativar' }}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="section === 'products'" class="panel">
        <div class="panel-heading"><h2>Todos os produtos</h2><span>{{ productTotal }} resultados</span></div>
        <div class="table-wrap"><table><thead><tr><th>Produto</th><th>Loja</th><th>Preço</th><th>Quantidade</th><th>Status</th></tr></thead>
          <tbody><tr v-for="product in products" :key="product._id"><td>{{ product.name }}</td><td>{{ product.store }}</td><td>{{ formatPrice(product.price) }}</td><td>{{ product.quantity }}</td><td>{{ product.published ? 'Publicado' : 'Rascunho' }}</td></tr></tbody>
        </table></div>
      </section>

      <section v-else-if="section === 'users'" class="panel">
        <div class="panel-heading"><h2>Usuários</h2><span>{{ userTotal }} resultados</span></div>
        <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Loja</th><th>Perfil</th></tr></thead>
          <tbody><tr v-for="user in users" :key="user._id"><td>{{ user.name }}</td><td>{{ user.email }}</td><td>{{ user.store || '-' }}</td><td><span class="status active">{{ user.kind }}</span></td></tr></tbody>
        </table></div>
      </section>

      <section v-else class="panel">
        <div class="panel-heading"><h2>Pedidos</h2><span>{{ orderTotal }} resultados</span></div>
        <div class="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th><th>Loja</th><th>Total</th><th>Status</th></tr></thead>
          <tbody><tr v-for="order in orders" :key="order._id"><td>{{ order.saleCode }}</td><td>{{ order.user?.name || '-' }}</td><td>{{ order.items?.[0]?.product?.store || '-' }}</td><td>{{ formatPrice(order.total) }}</td><td>{{ order.status }}</td></tr></tbody>
        </table></div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/Order'
import type { Product } from '~/types/Product'
import type { Store } from '~/types/Store'
import type { User } from '~/types/User'

type ManagedStore = Store & { owner?: { name?: string; email?: string } }

const authStore = useAuthStore()
const section = ref<'stores' | 'products' | 'users' | 'orders'>('stores')
const selectedStore = ref('')
const stores = ref<ManagedStore[]>([])
const products = ref<Product[]>([])
const users = ref<User[]>([])
const orders = ref<Order[]>([])
const productTotal = ref(0)
const userTotal = ref(0)
const orderTotal = ref(0)

const tabs = [
  { id: 'stores' as const, label: 'Lojas' },
  { id: 'products' as const, label: 'Produtos' },
  { id: 'users' as const, label: 'Usuários' },
  { id: 'orders' as const, label: 'Pedidos' },
]

async function loadStores() {
  const result = await $fetch<{ data: ManagedStore[] }>('/api/store/listStores', { params: { limit: 100 } })
  stores.value = result.data
}

async function loadProducts() {
  const result = await $fetch<{ data: Product[]; pagination: { total: number } }>('/api/product/searchProduct', {
    method: 'POST', body: { page: 1, limit: 100, store: selectedStore.value || undefined },
  })
  products.value = result.data
  productTotal.value = result.pagination.total
}

async function loadUsers() {
  const result = await $fetch<{ data: User[]; pagination: { total: number } }>('/api/user/listUsers', {
    params: { page: 1, limit: 100, store: selectedStore.value || undefined },
  })
  users.value = result.data
  userTotal.value = result.pagination.total
}

async function loadOrders() {
  const result = await $fetch<{ data: Order[]; pagination: { total: number } }>('/api/order/listAllOrders', {
    params: { page: 1, limit: 100, store: selectedStore.value || undefined },
  })
  orders.value = result.data
  orderTotal.value = result.pagination.total
}

async function refreshCurrentSection() {
  if (section.value === 'products') await loadProducts()
  if (section.value === 'users') await loadUsers()
  if (section.value === 'orders') await loadOrders()
}

async function changeSection(nextSection: typeof section.value) {
  section.value = nextSection
  if (nextSection === 'products') await loadProducts()
  if (nextSection === 'users') await loadUsers()
  if (nextSection === 'orders') await loadOrders()
}

async function toggleStore(store: ManagedStore) {
  const active = store.active === false
  await $fetch('/api/store/updateActive', { method: 'PATCH', body: { storeId: store._id, active } })
  store.active = active
}

function formatPrice(value: number) {
  return (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function logout() {
  authStore.clearUser()
  navigateTo('/')
}

definePageMeta({ middleware: 'auth' })
onMounted(loadStores)
</script>

<style scoped>
.super-page { min-height: 100vh; background: #f2ede6; color: #241f1d; }
.super-shell { width: min(100% - 32px, 1240px); margin: auto; padding: 42px 0 70px; }
.super-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 38px; }
.eyebrow { margin: 0 0 10px; color: #7a1f2e; font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
h1, h2 { font-family: 'Cormorant Garamond', serif; font-weight: 600; }
h1 { margin: 0 0 8px; font-size: clamp(2.8rem, 6vw, 5rem); line-height: .9; }
.super-header p:not(.eyebrow) { margin: 0; color: #756c66; }
.logout-button, .row-action { border: 1px solid #7a1f2e; color: #7a1f2e; background: transparent; padding: 10px 14px; cursor: pointer; font: inherit; }
.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 18px 0; border-top: 1px solid #cec2b9; border-bottom: 1px solid #cec2b9; }
.toolbar label { display: flex; flex-direction: column; gap: 7px; color: #625852; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.toolbar select { min-width: 250px; padding: 11px; border: 1px solid #c9c0b7; background: #fffaf5; color: #241f1d; font: inherit; }
.tabs { display: flex; gap: 18px; }
.tabs button { border: 0; border-bottom: 2px solid transparent; padding: 10px 0; color: #756c66; background: transparent; cursor: pointer; font: inherit; }
.tabs button.active { border-color: #7a1f2e; color: #7a1f2e; font-weight: 700; }
.panel { margin-top: 28px; padding: 22px; background: #fffaf5; border: 1px solid #d8cec5; }
.panel-heading { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px; }
.panel-heading h2 { margin: 0; font-size: 2rem; }
.panel-heading span { color: #756c66; font-size: .8rem; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th { color: #756c66; font-size: .72rem; letter-spacing: .06em; text-align: left; text-transform: uppercase; }
th, td { padding: 14px 10px; border-bottom: 1px solid #e3d9d0; white-space: nowrap; }
.store-name { display: inline-flex; align-items: center; gap: 8px; color: var(--row-color, #7a1f2e); }
.store-name i { width: 10px; height: 10px; border-radius: 50%; background: var(--row-color, #7a1f2e); }
td small { display: block; margin-top: 3px; color: #756c66; font-size: .75rem; }
.status { display: inline-block; padding: 4px 9px; font-size: .75rem; text-transform: capitalize; }
.status.active { color: #2d7a3a; background: #e8f5e9; }
.status.inactive { color: #777; background: #eee; }
@media (max-width: 800px) { .super-header, .toolbar { align-items: flex-start; flex-direction: column; } .tabs { width: 100%; overflow-x: auto; } .toolbar select { width: 100%; } .panel { padding: 14px; } }
</style>
