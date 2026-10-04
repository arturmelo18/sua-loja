<template>
  <div class="admin-dashboard-container">
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
        <el-button type="primary" :style="{ background: storeColor, borderColor: storeColor }" @click="loadDashboard">
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

      <div class="charts-grid">
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { Product } from '~/types/Product'

const props = defineProps<{
  isSuperAdmin?: boolean
  globalStoreFilter?: string
  storeColor?: string
}>()

const authStore = useAuthStore()
const isLoadingDash = ref(false)
const allProducts = ref<Product[]>([])

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

async function loadProductsForFilter() {
  try {
    const storeToFetch = props.isSuperAdmin ? props.globalStoreFilter : authStore.user?.store
    const res = await $fetch<any>('/api/product/searchProduct', {
      method: 'POST',
      body: { limit: 1000, page: 1, store: storeToFetch || undefined },
    })
    allProducts.value = res.data || []
  } catch (error) {
    console.error('Error fetching products for filter', error)
  }
}

async function loadDashboard() {
  isLoadingDash.value = true
  try {
    const storeToFetch = props.isSuperAdmin ? props.globalStoreFilter : authStore.user?.store
    const result = await $fetch<any>('/api/order/dashboard', {
      params: {
        startDate: dashFilters.startDate || undefined,
        endDate:   dashFilters.endDate   || undefined,
        status:    dashFilters.status    || undefined,
        productId: dashFilters.productId || undefined,
        store: storeToFetch || undefined,
      },
    })
    dash.kpis           = result.kpis
    dash.salesByDay     = result.salesByDay
    dash.salesByProduct = result.salesByProduct
    dash.salesByStatus  = result.salesByStatus
  } catch (e) {
    console.error('erro dashboard:', e)
  } finally {
    isLoadingDash.value = false
    await nextTick()
    renderCharts()
  }
}

function clearDashFilters() {
  dashFilters.startDate = formatDateFilter(twoWeeksAgo)
  dashFilters.endDate   = formatDateFilter(today)
  dashFilters.status    = ''
  dashFilters.productId = ''
  loadDashboard()
}

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function renderCharts() {
  const brandColor = props.storeColor || '#7A1F2E'

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
          borderColor: brandColor,
          backgroundColor: brandColor + '14',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: brandColor,
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
    const colors = [brandColor, '#9B2D3F','#B85C6E','#D4CBBD','#4a0f01','#c0a090','#E8E0D5','#6B6B6B','#1A1A1A','#F2EDE6']
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
      PAID: '#2d7a3a', PENDING: '#e6a817', EXPIRED: '#888', CANCELLED: brandColor, REFUNDED: '#3949ab',
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

watch(() => props.globalStoreFilter, () => {
  loadProductsForFilter()
  loadDashboard()
})

onMounted(() => {
  loadProductsForFilter()
  loadDashboard()
})
</script>

<style scoped>
.adm-title { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin-bottom: 24px; }
.dash-filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: flex-end; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #eee; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #eee; display: flex; flex-direction: column; gap: 8px; }
.kpi-label { font-size: .8rem; color: #666; font-weight: 500; text-transform: uppercase; }
.kpi-value { font-size: 1.6rem; font-weight: 700; color: #1a1a1a; }
.kpi-green { color: #2d7a3a; }
.kpi-amber { color: #e6a817; }
.charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.chart-wide { grid-column: 1 / -1; }
@media (min-width: 1024px) {
  .charts-grid { grid-template-columns: 2fr 1fr 1fr; }
}
.chart-card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; display: flex; flex-direction: column; }
.chart-title { font-size: .9rem; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.chart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; padding: 32px 0; }
.chart-empty i { font-size: 2rem; opacity: .5; }
</style>