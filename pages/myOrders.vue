<template>
  <div class="page-wrapper" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
    <NavBar />

    <main class="orders-main">
      <h1 class="page-title">Meus Pedidos</h1>

      <div v-if="isLoading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="!orders.length" class="empty-state">
        <i class="ti ti-clipboard-off"></i>
        <p>Você ainda não fez nenhum pedido</p>
        <button class="btn btn-dark" @click="navigateTo('/')">Ver Produtos</button>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order._id" class="order-card">

          <div class="order-head">
            <div class="order-head-left">
              <span class="sale-code">{{ order.saleCode }}</span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-head-right">
              <span :class="['badge', `badge-${order.status.toLowerCase()}`]">
                {{ statusLabel(order.status) }}
              </span>
              <span :class="['badge', order.readyForPickup ? 'badge-pickup-ready' : 'badge-pickup-pending']">
                {{ order.readyForPickup ? '✓ Pronto para retirada' : 'Aguardando retirada' }}
              </span>
            </div>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item._id" class="order-item">
              <div class="item-img">
                <img v-if="item.product.image" :src="item.product.image" :alt="item.product.name" />
                <i v-else class="ti ti-shirt" aria-hidden="true"></i>
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.product.name }}</span>
                <span class="item-qty">Quantidade: {{ item.quantity }}</span>
              </div>
              <span class="item-price">{{ formatPrice((item.price ?? item.product.price) * item.quantity / 100) }}</span>
            </div>
          </div>

          <div class="order-foot">
            <span class="order-total">Total: {{ formatPrice(order.total / 100) }}</span>
            <span class="pickup-tag">
              <i class="ti ti-map-pin" aria-hidden="true"></i>
              Retirada na Fatec
            </span>
          </div>

        </div>
      </div>
    </main>

    <LofFooter />
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/Order'

const authStore = useAuthStore()
const { storeColor, loadStoreTheme } = useStoreTheme()
const isLoading = ref(false)
const orders = ref<Order[]>([])

onMounted(async () => {
  await loadStoreTheme({ ownerId: authStore.getUser?._id })
  isLoading.value = true
  try {
    orders.value = await $fetch<Order[]>('/api/order/listMyOrders', {
      params: { userId: authStore.getUser?._id },
    })
  } catch {
    ElMessage.error('Erro ao carregar pedidos')
  } finally {
    isLoading.value = false
  }
})

const formatPrice = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const statusLabel = (s: string) => ({
  PENDING:    'Aguardando pagamento',
  PAID:       'Pago',
  EXPIRED:    'Expirado',
  CANCELLED:  'Cancelado',
  REFUNDED:   'Reembolsado',
}[s] ?? s)

definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F2EDE6;
}

.orders-main {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 3rem 2rem 5rem;
}

.page-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 38px;
  font-weight: 300;
  font-style: italic;
  color: var(--store-color, #7A1F2E);
  margin-bottom: 2rem;
}

.orders-list { display: flex; flex-direction: column; gap: 1.25rem; }

.order-card {
  background: #fff;
  border: 1px solid var(--border);
  overflow: hidden;
}

.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--cream-dark);
  flex-wrap: wrap;
  gap: 8px;
}

.order-head-left { display: flex; flex-direction: column; gap: 3px; }

.sale-code {
  font-size: 13px;
  font-weight: 500;
  color: var(--black);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.order-date { font-size: 12px; color: var(--gray); }

.order-head-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.badge {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-pending   { background: #FFF8E1; color: #7a5200; border: 1px solid #f0d070; }
.badge-paid      { background: #E8F5E9; color: #1b5e20; border: 1px solid #a5d6a7; }
.badge-expired   { background: #F5F5F5; color: #555;    border: 1px solid #ccc; }
.badge-cancelled { background: #FDECEA; color: #7A1F2E; border: 1px solid #f5c0c0; }
.badge-refunded  { background: #E8EAF6; color: #3949ab; border: 1px solid #b3bce8; }

.badge-pickup-ready   { background: #E8F5E9; color: #1b5e20; border: 1px solid #a5d6a7; }
.badge-pickup-pending { background: #F5F5F5; color: #555;    border: 1px solid #ccc; }

.order-items { padding: 0 1.5rem; }

.order-item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
}

.order-item:last-child { border-bottom: none; }

.item-img {
  width: 56px;
  height: 56px;
  background: var(--cream-dark);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-img i   { font-size: 22px; color: #c0a090; }

.item-info { display: flex; flex-direction: column; gap: 3px; }
.item-name { font-size: 14px; font-weight: 500; color: var(--black); }
.item-qty  { font-size: 12px; color: var(--gray); }
.item-price{ font-size: 14px; font-weight: 500; color: var(--black); white-space: nowrap; }

.order-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  background: var(--cream-dark);
}

.order-total {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 20px;
  font-weight: 400;
  color: var(--black);
}

.pickup-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--gray);
}

.pickup-tag i { font-size: 14px; }

.empty-state { text-align: center; padding: 5rem 2rem; }
.empty-state i { font-size: 56px; color: #c0a090; display: block; margin-bottom: 1rem; }
.empty-state p { color: var(--gray); font-size: 15px; margin-bottom: 1.5rem; }
.loading-state { padding: 2rem 0; }

@media (max-width: 600px) {
  .order-item { grid-template-columns: 48px 1fr; }
  .item-price { grid-column: 2; }
  .order-head { flex-direction: column; align-items: flex-start; }
}
</style>