<template>
  <div class="h-screen w-screen bg-cream success-theme" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
    <NavBar />

    <div class="success-wrapper">
      <div class="success-card">
        <div class="success-icon">
          <i class="ti ti-circle-check"></i>
        </div>
        <h1 class="success-title">Pedido Recebido!</h1>
        <p class="success-sub">
          {{ paymentStatus === 'PAID'
            ? 'Seu pagamento foi confirmado e o carrinho foi atualizado.'
            : 'Seu pagamento está sendo processado. Você receberá uma confirmação assim que aprovado.' }}
        </p>
        <button class="btn btn-dark" @click="navigateTo('/')">
          Continuar Comprando
        </button>
      </div>
    </div>

    <LofFooter />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { storeColor, loadStoreTheme } = useStoreTheme()
const route = useRoute()
const paymentStatus = ref('PENDING')

async function refreshCart() {
  const userId = authStore.getUser?._id
  if (!userId) return

  const cart = await $fetch<any>('/api/cart/getCart', {
    params: { userId },
  })

  if (!cart?.items?.length) {
    authStore.clearCart()
  } else {
    authStore.setCart(cart)
  }
}

async function waitForPaymentConfirmation() {
  const externalId = String(route.query.externalId || '')
  if (!externalId) {
    authStore.clearCart()
    return
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const result = await $fetch<{ status: string }>('/api/order/status', {
        params: { externalId },
      })
      paymentStatus.value = result.status

      if (result.status === 'PAID') {
        await refreshCart()
        return
      }
    } catch {
      // O webhook pode chegar depois do redirecionamento.
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

onMounted(async () => {
  await loadStoreTheme({ ownerId: authStore.getUser?._id })
  authStore.clearCart()
  await waitForPaymentConfirmation()
})

definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.bg-cream { background: #F2EDE6; }

.success-theme :deep(.btn-dark) {
  background: var(--store-color, #7A1F2E);
  border-color: var(--store-color, #7A1F2E);
}

.success-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  padding: 2rem;
}

.success-card {
  background: #fff;
  border-radius: 12px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 480px;
  width: 100%;
  border: 0.5px solid rgba(74, 15, 1, 0.07);
}

.success-icon {
  font-size: 56px;
  color: #4a7c59;
  margin-bottom: 1.5rem;
  line-height: 1;
}

.success-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 300;
  font-style: italic;
  color: var(--black);
  margin-bottom: 1rem;
}

.success-sub {
  font-size: 14px;
  color: var(--gray);
  line-height: 1.7;
  margin-bottom: 2rem;
}
</style>