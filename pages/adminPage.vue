<template>
  <div class="h-screen w-screen bg-cream">
    <nav-bar />
    
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="adm-sidebar-title">Painel Admin</div>
        <ul class="adm-nav">
          <li><a @click="loadDashboard(); currentSection = 'dashboard'" :class="{ active: currentSection === 'dashboard' }">Dashboard</a></li>
          <li><a @click="loadStore(); currentSection = 'loja'" :class="{ active: currentSection === 'loja' }">Loja</a></li> 
          <li><a @click="loadUsers(); currentSection = 'usuarios'" :class="{ active: currentSection === 'usuarios' }">Usuários</a></li>
          <li><a @click="loadAllOrders(); currentSection = 'pedidos'" :class="{ active: currentSection === 'pedidos' }">Pedidos</a></li>
          <li><a @click="currentSection = 'produtos'" :class="{ active: currentSection === 'produtos' }">Produtos</a></li>
          <li><a @click="navigateTo('/productPage')" class="adm-nav-link">+ Novo Produto</a></li>
        </ul>
      </aside>
      
      <main class="admin-main">

        <!-- Dashboard -->
        <div v-if="currentSection === 'dashboard'">
          <div class="adm-title">Dashboard</div>

          <div class="dash-filters">
            <!-- Data início -->
            <el-date-picker
              v-model="dashFilters.startDate"
              type="date"
              placeholder="Início"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
            />

            <!-- Data fim -->
            <el-date-picker
              v-model="dashFilters.endDate"
              type="date"
              placeholder="Fim"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
            />

            <!-- Status -->
            <el-select v-model="dashFilters.status" placeholder="Todos" clearable style="width:180px;">
              <el-option label="Pago"                 value="PAID" />
              <el-option label="Aguardando pagamento" value="PENDING" />
              <el-option label="Expirado"             value="EXPIRED" />
              <el-option label="Cancelado"            value="CANCELLED" />
              <el-option label="Reembolsado"          value="REFUNDED" />
            </el-select>

            <!-- Produto -->
            <el-select
              v-model="dashFilters.productId"
              placeholder="Todos"
              clearable
              filterable
              style="width:200px;"
            >
              <el-option v-for="p in allProducts" :key="p._id" :label="p.name" :value="p._id" />
            </el-select>

            <!-- Botões -->
            <div style="display:flex;gap:8px;align-self:flex-end;">
              <el-button @click="clearDashFilters">Limpar</el-button>
              <el-button type="primary" style="background:#7A1F2E;border-color:#7A1F2E;" @click="loadDashboard">
                Aplicar filtros
              </el-button>
            </div>
          </div>

          <div v-if="isLoadingDash" style="padding: 2rem 0;">
            <el-skeleton :rows="6" animated />
          </div>

          <div v-else>
            <div class="kpi-grid">
              <div class="kpi-card">
                <span class="kpi-label">Receita total</span>
                <span class="kpi-value">{{ formatPrice(dash.kpis.totalRevenue / 100) }}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Receita confirmada</span>
                <span class="kpi-value kpi-green">{{ formatPrice(dash.kpis.paidRevenue / 100) }}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Ticket médio</span>
                <span class="kpi-value">{{ formatPrice(dash.kpis.avgTicket / 100) }}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Total de pedidos</span>
                <span class="kpi-value">{{ dash.kpis.totalOrders }}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Pedidos pagos</span>
                <span class="kpi-value kpi-green">{{ dash.kpis.paidOrders }}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Aguardando pagamento</span>
                <span class="kpi-value kpi-amber">{{ dash.kpis.pendingOrders }}</span>
              </div>
            </div>

            <div v-if="isLoadingDash" class="charts-grid">
              <div class="chart-card chart-wide">
                <span class="chart-title">Vendas por dia</span>
                <el-skeleton style="height: 220px;" animated />
              </div>
              <div class="chart-card">
                <span class="chart-title">Receita por produto</span>
                <el-skeleton style="height: 220px;" animated />
              </div>
              <div class="chart-card">
                <span class="chart-title">Status dos pedidos</span>
                <el-skeleton style="height: 220px;" animated />
              </div>
            </div>

            <div v-else class="charts-grid">
              <div class="chart-card chart-wide">
                <span class="chart-title">Vendas por dia</span>
                <div v-if="!dash.salesByDay.length" class="chart-empty">
                  <i class="ti ti-chart-line" aria-hidden="true"></i>
                  <span>Nenhuma venda no período</span>
                </div>
                <canvas v-else id="salesLineChart"></canvas>
              </div>

              <div class="chart-card">
                <span class="chart-title">Receita por produto</span>
                <div v-if="!dash.salesByProduct.length" class="chart-empty">
                  <i class="ti ti-chart-donut" aria-hidden="true"></i>
                  <span>Sem dados de produtos</span>
                </div>
                <canvas v-else id="productDonutChart"></canvas>
              </div>

              <div class="chart-card">
                <span class="chart-title">Status dos pedidos</span>
                <div v-if="!dash.salesByStatus.length" class="chart-empty">
                  <i class="ti ti-chart-donut" aria-hidden="true"></i>
                  <span>Sem dados de pedidos</span>
                </div>
                <canvas v-else id="statusDonutChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Produtos -->
        <div v-if="currentSection === 'produtos'">
          <div class="adm-title">Gerenciar Produtos</div>
          <div v-if="!isLoadingProducts" class="products-table-container mt-5" v-infinite-scroll="nextPage">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Quantidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in state.products" :key="product._id">
                  <td><img :src="product.image" class="product-image" /></td>
                  <td>{{ product.name }}</td>
                  <td>{{ formatPrice(product.price / 100) }}</td>
                  <td>{{ product.quantity }}</td>
                  <td>
                    <div class="action-buttons">
                      <el-button class="edit-button" @click="goToEditProduct(product._id)">Editar</el-button>
                      <el-button class="delete-button mx-1" @click="inativeProduct(product._id)">
                        <i class="uil uil-trash-alt text-red-800 text-2xl"></i>
                      </el-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else><span>Carregando produtos...</span></div>
        </div>

        <!-- Usuários -->
        <div v-if="currentSection === 'usuarios'">
          <div class="adm-title">Gerenciar Usuários</div>
          <div v-if="!isLoadingUsers" class="products-table-container mt-5">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in state.users" :key="user._id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span :class="['kind-badge', user.kind === 'admin' ? 'kind-admin' : 'kind-user']">
                      {{ user.kind === 'admin' ? 'Admin' : 'Usuário' }}
                    </span>
                  </td>
                  <td>
                    <el-button class="edit-button" @click="toggleKind(user)">
                      {{ user.kind === 'admin' ? 'Tornar Usuário' : 'Tornar Admin' }}
                    </el-button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-row">
              <el-button :disabled="usersPage <= 1" @click="prevUsersPage">Anterior</el-button>
              <span class="page-info">Página {{ usersPage }}</span>
              <el-button :disabled="usersPage * USERS_LIMIT >= usersTotal" @click="nextUsersPage">Próxima</el-button>
            </div>
          </div>
          <div v-else><span>Carregando usuários...</span></div>
        </div>

        <!-- Pedidos -->
        <div v-if="currentSection === 'pedidos'">
          <div class="adm-title">Gerenciar Pedidos</div>
          <div class="search-row">
            <el-input
              v-model="orderSearch"
              placeholder="Buscar por código ou nome do cliente"
              clearable
              @input="loadAllOrders"
              style="max-width: 380px;"
            />
          </div>
          <div v-if="!isLoadingOrders" class="products-table-container mt-5">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Retirada</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in allOrders" :key="order._id">
                  <td><span class="sale-code-cell">{{ order.saleCode }}</span></td>
                  <td>
                    <div style="display:flex;flex-direction:column;gap:2px;">
                      <span style="font-weight:500;font-size:13px;">{{ order.user.name }}</span>
                      <span style="font-size:11px;color:#6B6B6B;">{{ order.user.email }}</span>
                    </div>
                  </td>
                  <td>{{ formatPrice(order.total / 100) }}</td>
                  <td>
                    <span :class="['kind-badge', `status-${order.status.toLowerCase()}`]">
                      {{ statusLabel(order.status) }}
                    </span>
                  </td>
                  <td>
                    <span :class="['kind-badge', order.readyForPickup ? 'pickup-ready' : 'pickup-pending']">
                      {{ order.readyForPickup ? 'Pronto' : 'Pendente' }}
                    </span>
                  </td>
                  <td style="font-size:12px;color:#6B6B6B;">{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <el-button class="edit-button" @click="togglePickup(order)">
                      {{ order.readyForPickup ? 'Marcar Pendente' : 'Marcar Pronto' }}
                    </el-button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-row">
              <el-button :disabled="ordersPage <= 1" @click="prevOrdersPage">Anterior</el-button>
              <span class="page-info">Página {{ ordersPage }}</span>
              <el-button :disabled="ordersPage * ORDERS_LIMIT >= ordersTotal" @click="nextOrdersPage">Próxima</el-button>
            </div>
          </div>
          <div v-else><span>Carregando pedidos...</span></div>
        </div>

        <!-- Loja -->
        <div v-if="currentSection === 'loja'">
          <div class="adm-title">Configurações da Loja</div>

          <div v-if="isLoadingStore" style="padding: 2rem 0;">
            <el-skeleton :rows="4" animated />
          </div>

          <div v-else class="products-table-container" style="max-width: 700px;">
            <div style="margin-bottom: 1.5rem;">
              <label class="filter-group" style="display:flex;flex-direction:column;gap:4px;margin-bottom:1rem;">
                <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6B6B6B;font-weight:500;">
                  Nome da Loja
                </span>
                <el-input v-model="storeForm.name" placeholder="Ex: Fatecano" />
              </label>

              <label class="filter-group" style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6B6B6B;font-weight:500;">
                  Loja / URL
                </span>
                <el-input v-model="storeForm.store" placeholder="Ex: fatecano" />
              </label>

              <label class="filter-group" style="display:flex;flex-direction:column;gap:4px;margin-top:1rem;">
                <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6B6B6B;font-weight:500;">
                  Cor da loja
                </span>
                <el-color-picker v-model="storeForm.color" />
              </label>
            </div>

            <div style="margin-bottom: 1rem;">
              <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6B6B6B;font-weight:500;display:block;margin-bottom:1rem;">
                Slides do Carrossel
              </span>

              <div
                v-for="(slide, index) in storeForm.slides"
                :key="index"
                class="slide-editor"
              >
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                  <span style="font-size:13px;font-weight:500;color:#333;">Slide {{ index + 1 }}</span>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="removeSlide(index)"
                    :disabled="storeForm.slides.length <= 1"
                  >
                    Remover
                  </el-button>
                </div>

                <div style="display:flex;flex-direction:column;gap:0.75rem;">
                  <div>
                    <label style="font-size:12px;color:#6B6B6B;display:block;margin-bottom:4px;">Título</label>
                    <el-input v-model="slide.title" placeholder="Ex: Bem-vindo ao Fatecano" />
                  </div>
                  <div>
                    <label style="font-size:12px;color:#6B6B6B;display:block;margin-bottom:4px;">Descrição</label>
                    <el-input v-model="slide.description" placeholder="Subtítulo do slide" />
                  </div>
                  <div>
                    <label style="font-size:12px;color:#6B6B6B;display:block;margin-bottom:4px;">Imagem</label>
                    <div style="display:flex;gap:12px;align-items:center;">
                      <el-upload
                        action="#"
                        :show-file-list="false"
                        :auto-upload="false"
                        :on-change="(file: any) => handleSlideImage(file, index)"
                      >
                        <el-button size="small">Selecionar imagem</el-button>
                      </el-upload>
                      <img
                        v-if="slide.image"
                        :src="slide.image"
                        style="width:80px;height:45px;object-fit:cover;border-radius:4px;border:1px solid #ddd;"
                      />
                      <span v-else style="font-size:12px;color:#aaa;">Nenhuma imagem</span>
                    </div>
                  </div>
                </div>
              </div>

              <el-button
                style="margin-top:1rem;width:100%;"
                @click="addSlide"
                :disabled="storeForm.slides.length >= 5"
              >
                + Adicionar Slide
              </el-button>
            </div>

            <el-button
              class="btn-primary"
              style="width:100%;margin-top:1rem;"
              :disabled="isSavingStore"
              @click="saveStore"
            >
              {{ isSavingStore ? 'Salvando...' : 'Salvar Configurações' }}
            </el-button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

import { Chart, registerables } from 'chart.js'
import type { Order } from '~/types/Order'
import type { Product } from '~/types/Product'
import type { User } from '~/types/User'

Chart.register(...registerables)

const isLoadingProducts = ref(false)
const isLoadingUsers    = ref(false)
const isLoadingOrders   = ref(false)
const isLoadingDash     = ref(false)
const currentSection    = ref('dashboard')

const LIMIT        = 10
const USERS_LIMIT  = 10
const ORDERS_LIMIT = 10

const state = reactive({
  page:     1,
  total:    0,
  products: [] as Product[],
  users:    [] as User[],
})

const usersPage  = ref(1)
const usersTotal = ref(0)

const ordersPage  = ref(1)
const ordersTotal = ref(0)
const orderSearch = ref('')
const allOrders   = ref<Order[]>([])

// ── Dashboard ─────────────────────────────────────────────


const today = new Date()
const twoWeeksAgo = new Date()
twoWeeksAgo.setDate(today.getDate() - 14)

const formatDateFilter = (date: Date) => date.toISOString().split('T')[0]

const dashFilters = reactive({
  startDate: formatDateFilter(twoWeeksAgo),
  endDate:   formatDateFilter(today),
  status:    '',
  productId: '',
})

const dash = reactive({
  kpis: {
    totalRevenue:  0,
    paidRevenue:   0,
    avgTicket:     0,
    totalOrders:   0,
    paidOrders:    0,
    pendingOrders: 0,
  },
  salesByDay:     [] as { date: string; total: number; count: number }[],
  salesByProduct: [] as { name: string; totalRevenue: number }[],
  salesByStatus:  [] as { status: string; count: number }[],
})

let lineChart:   Chart | null = null
let donutChart:  Chart | null = null
let statusChart: Chart | null = null

async function loadDashboard() {
  isLoadingDash.value = true
  console.log('loadDashboard chamado com:', { ...dashFilters })
  try {
    const result = await $fetch<any>('/api/order/dashboard', {
      params: {
        startDate: dashFilters.startDate || undefined,
        endDate:   dashFilters.endDate   || undefined,
        status:    dashFilters.status    || undefined,
        productId: dashFilters.productId || undefined,
      },
    })
    console.log('resultado dashboard:', result)
    dash.kpis           = result.kpis
    dash.salesByDay     = result.salesByDay
    dash.salesByProduct = result.salesByProduct
    dash.salesByStatus  = result.salesByStatus
  } catch (e) {
    console.error('erro dashboard:', e)
    ElMessage.error('Erro ao carregar dashboard')
  } finally {
    isLoadingDash.value = false
    await nextTick()
    renderCharts()
  }
}

function clearDashFilters() {
  const today = new Date()
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(today.getDate() - 14)

  dashFilters.startDate = formatDateFilter(twoWeeksAgo)
  dashFilters.endDate   = formatDateFilter(today)
  dashFilters.status    = ''
  dashFilters.productId = ''
  loadDashboard()
}

function renderCharts() {
  const lineCtx = document.getElementById('salesLineChart') as HTMLCanvasElement
  if (lineCtx) {
    lineChart?.destroy()
    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: dash.salesByDay.map(d => d.date),
        datasets: [{
          label: 'Receita (R$)',
          data: dash.salesByDay.map(d => d.total / 100),
          borderColor: '#7A1F2E',
          backgroundColor: 'rgba(122,31,46,0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#7A1F2E',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `R$ ${Number(v).toLocaleString('pt-BR')}` },
          },
        },
      },
    })
  }

  const donutCtx = document.getElementById('productDonutChart') as HTMLCanvasElement
  if (donutCtx) {
    donutChart?.destroy()
    const colors = ['#7A1F2E','#9B2D3F','#B85C6E','#D4CBBD','#4a0f01','#c0a090','#E8E0D5','#6B6B6B','#1A1A1A','#F2EDE6']
    donutChart = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: dash.salesByProduct.map(p => p.name),
        datasets: [{
          data: dash.salesByProduct.map(p => p.totalRevenue / 100),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` R$ ${Number(ctx.parsed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            },
          },
        },
      },
    })
  }

  const statusCtx = document.getElementById('statusDonutChart') as HTMLCanvasElement
  if (statusCtx) {
    statusChart?.destroy()
    const statusColors: Record<string, string> = {
      PAID: '#2d7a3a', PENDING: '#e6a817', EXPIRED: '#888', CANCELLED: '#7A1F2E', REFUNDED: '#3949ab',
    }
    const statusNames: Record<string, string> = {
      PAID: 'Pago', PENDING: 'Aguardando', EXPIRED: 'Expirado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
    }
    statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: dash.salesByStatus.map(s => statusNames[s.status] ?? s.status),
        datasets: [{
          data: dash.salesByStatus.map(s => s.count),
          backgroundColor: dash.salesByStatus.map(s => statusColors[s.status] ?? '#ccc'),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12 } },
        },
      },
    })
  }
}

// ── Produtos ──────────────────────────────────────────────

async function searchProducts(reset = false) {
  try {
    isLoadingProducts.value = true
    if (reset) { state.page = 1; state.products = [] }
    const result = await $fetch<any>('/api/product/searchProduct', {
      method: 'POST',
      body: { page: state.page, limit: LIMIT },
    })
    state.page     = result.pagination.page
    state.total    = result.pagination.total
    state.products = [...state.products, ...(result.data as Product[])]
  } catch (error: any) {
    ElMessage.error(error.message || 'Erro inesperado')
  } finally {
    isLoadingProducts.value = false
  }
}

function nextPage() {
  if (state.page * LIMIT >= state.total) return
  state.page += 1
  searchProducts()
}

const goToEditProduct = (productId?: string) => {
  if (!productId) return
  navigateTo({ path: '/productPage', query: { _id: productId } })
}

async function inativeProduct(productId?: string) {
  if (!productId) return
  try {
    await ElMessageBox.confirm('Você quer realmente excluir o produto?', 'Atenção', {
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
      confirmButtonClass: 'el-button--danger',
    })
    await $fetch('/api/product/inativeProduct', { method: 'PUT', body: { productId } })
    ElMessage.success('Produto excluído com sucesso!')
    searchProducts(true)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('Erro ao excluir o produto.')
  }
}

// ── Usuários ──────────────────────────────────────────────

async function loadUsers() {
  try {
    isLoadingUsers.value = true
    const result = await $fetch<any>('/api/user/listUsers', {
      params: { page: usersPage.value, limit: USERS_LIMIT },
    })
    state.users  = result.data as User[]
    usersTotal.value = result.pagination.total
  } catch {
    ElMessage.error('Erro ao carregar usuários')
  } finally {
    isLoadingUsers.value = false
  }
}

async function prevUsersPage() {
  if (usersPage.value <= 1) return
  usersPage.value--; await loadUsers()
}

async function nextUsersPage() {
  if (usersPage.value * USERS_LIMIT >= usersTotal.value) return
  usersPage.value++; await loadUsers()
}

async function toggleKind(user: User) {
  const newKind = user.kind === 'admin' ? 'user' : 'admin'
  const label   = newKind === 'admin' ? 'administrador' : 'usuário comum'
  try {
    await ElMessageBox.confirm(`Deseja tornar ${user.name} um ${label}?`, 'Confirmar alteração', {
      confirmButtonText: 'Sim', cancelButtonText: 'Não',
    })
    await $fetch('/api/user/updateKind', { method: 'PATCH', body: { userId: user._id, kind: newKind } })
    const index = state.users.findIndex(u => u._id === user._id)
    if (index !== -1) state.users[index] = { ...state.users[index], kind: newKind } as User
    ElMessage.success(`${user.name} agora é ${label}`)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('Erro ao atualizar tipo do usuário')
  }
}

// ── Pedidos ──────────────────────────────────────────────

async function loadAllOrders() {
  isLoadingOrders.value = true
  try {
    const result = await $fetch<any>('/api/order/listAllOrders', {
      params: { page: ordersPage.value, limit: ORDERS_LIMIT, search: orderSearch.value },
    })
    allOrders.value    = result.data as Order[]
    ordersTotal.value  = result.pagination.total
  } catch {
    ElMessage.error('Erro ao carregar pedidos')
  } finally {
    isLoadingOrders.value = false
  }
}

async function prevOrdersPage() {
  if (ordersPage.value <= 1) return
  ordersPage.value--; await loadAllOrders()
}

async function nextOrdersPage() {
  if (ordersPage.value * ORDERS_LIMIT >= ordersTotal.value) return
  ordersPage.value++; await loadAllOrders()
}

async function togglePickup(order: Order) {
  const newValue = !order.readyForPickup
  const label    = newValue ? 'pronto para retirada' : 'pendente'
  try {
    await ElMessageBox.confirm(`Marcar pedido ${order.saleCode} como ${label}?`, 'Confirmar', {
      confirmButtonText: 'Sim', cancelButtonText: 'Não',
    })
    await $fetch('/api/order/updatePickup', { method: 'PATCH', body: { orderId: order._id, readyForPickup: newValue } })
    const index = allOrders.value.findIndex(o => o._id === order._id)
    if (index !== -1) allOrders.value[index] = { ...allOrders.value[index], readyForPickup: newValue } as Order
    ElMessage.success(`Pedido marcado como ${label}`)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('Erro ao atualizar pedido')
  }
}

// ── Helpers ───────────────────────────────────────────────

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const statusLabel = (status: string) => ({
  PENDING: 'Aguardando pagamento', PAID: 'Pago', EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
}[status] ?? status)

const allProducts = ref<Product[]>([])

async function loadAllProducts() {
  const result = await $fetch<any>('/api/product/searchProduct', {
    method: 'POST',
    body: { page: 1, limit: 9999 },
  })
  allProducts.value = result.data as Product[]
}

import type { Store, StoreSlide } from '~/types/Store'

const isLoadingStore = ref(false)
const isSavingStore  = ref(false)

const storeForm = reactive({
  name: '',
  store: '',
  color: '#7A1F2E',
  slides: [] as StoreSlide[],
})

async function loadStore() {
  isLoadingStore.value = true
  try {
    const store = await $fetch<Store | null>('/api/store/getStore')
    if (store) {
      storeForm.name      = store.name
      storeForm.store = store.store || ''
      storeForm.color = store.color || '#7A1F2E'
      storeForm.slides    = store.slides
    } else {
      // default se não existir ainda
      storeForm.name      = 'Fatecano'
      storeForm.store = 'fatecano'
      storeForm.color = '#7A1F2E'
      storeForm.slides    = [{ title: '', description: '', image: '' }]
    }
  } catch {
    ElMessage.error('Erro ao carregar configurações da loja')
  } finally {
    isLoadingStore.value = false
  }
}

function addSlide() {
  storeForm.slides.push({ title: '', description: '', image: '' })
}

function removeSlide(index: number) {
  storeForm.slides.splice(index, 1)
}

function handleSlideImage(uploadFile: any, index: number) {
  if (!uploadFile.raw) return
  if (uploadFile.raw.size / 1024 / 1024 > 2) {
    ElMessage.error('A imagem não pode passar de 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    storeForm.slides[index].image = e.target?.result as string
  }
  reader.readAsDataURL(uploadFile.raw)
}

async function saveStore() {
  if (!storeForm.name) {
    ElMessage.error('Nome da loja é obrigatório')
    return
  }

  const storeValue = String(storeForm.store || '').trim().replace(/^@/, '').toLowerCase()

  if (!storeValue) {
    ElMessage.error('A loja / URL é obrigatória')
    return
  }

  const invalid = storeForm.slides.some(s => !s.title || !s.image)
  if (invalid) {
    ElMessage.error('Todos os slides precisam de título e imagem')
    return
  }

  isSavingStore.value = true
  try {
    await $fetch('/api/store/updateStore', {
      method: 'PUT',
      body: {
        ownerId: authStore.user?._id,
        name: storeForm.name,
        store: storeValue,
        color: storeForm.color,
        slides: storeForm.slides,
      },
    })
    ElMessage.success('Loja atualizada com sucesso!')
  } catch (e: any) {
    ElMessage.error(e.data?.statusMessage || 'Erro ao salvar')
  } finally {
    isSavingStore.value = false
  }
}

// ── Init ──────────────────────────────────────────────────

definePageMeta({ middleware: 'auth' })

onMounted(() => {
  searchProducts()
  loadAllProducts()
  loadDashboard()
})
</script>

<style scoped>
.bg-cream { background: #F2EDE6; }
.adm-nav-link { cursor: pointer; }
.admin-sidebar { background: #F2EDE6; }
.adm-nav { list-style: none; padding: 0; margin: 0; }
.adm-nav li { border-bottom: 1px solid #ddd; }
.adm-nav li a { display: block; padding: 12px 15px; color: #000; text-decoration: none; cursor: pointer; }
.adm-nav li a:hover, .adm-nav li a.active { background-color: #e9ecef; }

.products-table-container { background: #fff; border-radius: 8px; padding: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.products-table { width: 100%; border-collapse: collapse; text-align: left; }
.products-table th, .products-table td { padding: 12px 15px; border-bottom: 1px solid #e0e0e0; vertical-align: middle; }
.products-table th { font-weight: 600; color: #333; }
.products-table tbody tr:last-child td { border-bottom: none; }
.product-image { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.action-buttons { display: flex; align-items: center; }
.edit-button, .delete-button { border: none; background: transparent; padding: 6px; }

.kind-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.kind-admin { background: #fdecea; color: #7A1F2E; }
.kind-user  { background: #e8f4fd; color: #1a5276; }
.status-paid      { background: #E8F5E9; color: #1b5e20; }
.status-pending   { background: #FFF8E1; color: #7a5200; }
.status-expired   { background: #F5F5F5; color: #555; }
.status-cancelled { background: #FDECEA; color: #7A1F2E; }
.status-refunded  { background: #E8EAF6; color: #3949ab; }
.pickup-ready     { background: #E8F5E9; color: #1b5e20; }
.pickup-pending   { background: #F5F5F5; color: #555; }

.pagination-row { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; }
.page-info { font-size: 13px; color: #6B6B6B; }
.search-row { margin-bottom: 1rem; }
.sale-code-cell { font-size: 12px; font-weight: 500; letter-spacing: 0.04em; }

/* Dashboard */
.dash-filters {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6B6B6B; font-weight: 500; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6B6B6B; font-weight: 500; }
.kpi-value { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 400; color: #1A1A1A; line-height: 1; }
.kpi-green { color: #2d7a3a; }
.kpi-amber { color: #e6a817; }

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.chart-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-wide { grid-column: 1 / -1; }
.chart-title { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: #6B6B6B; }

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 200px;
  color: #aaa;
  font-size: 13px;
}

.chart-empty i {
  font-size: 36px;
  color: #D4CBBD;
}

.slide-editor {
  background: #faf9f7;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}
</style>