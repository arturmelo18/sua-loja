<template>
  <footer class="content">
    <GradientDivisor />
    <div class="footer-inner">
      <span>{{ storeName }}</span>
      <span>Todos os direitos reservados</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute()
const storeName = ref('Sua loja')
const storeSlug = computed(() => String(route.params.store || '').replace(/^@/, ''))

onMounted(async () => {
  try {
    const store = await $fetch<{ name?: string }>('/api/store/getStore', {
      params: storeSlug.value ? { store: storeSlug.value } : undefined,
    })

    if (store?.name) storeName.value = store.name
  } catch {
    // Mantém o nome padrão quando a loja ainda não foi configurada.
  }
})
</script>

<style scoped>
.content {
  background: #f2ede6;
  color: var(--store-color, #7A1F2E);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  min-height: 58px;
  padding: 12px 48px;
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 0.95rem;
}

.footer-inner span:last-child {
  color: #756c66;
  font-family: inherit;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .footer-inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
  }
}
</style>