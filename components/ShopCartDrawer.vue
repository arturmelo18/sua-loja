<template>
  <div class="page-container">
    <USlideover :dismissible="false" title="Carrinho de compras">
      <UButton color="neutral" variant="subtle" icon="i-lucide-shopping-cart" />

      <template #content>
        <div v-for="item in itens">
          <h1>{{ item.name }}</h1>
          <h2>{{ item.price }}</h2>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const itens = [
  {
    name: "item 1",
    price: "19,90",
  },
  {
    name: "item 2",
    price: "38,90",
  },
];
</script>

<style>
.page-container {
  background-color: color-mix(in srgb, var(--store-color, #7A1F2E) 5%, #fff);
  color: var(--store-color, #7A1F2E);
}

.page-container :deep(button) {
  color: var(--store-color, #7A1F2E);
  border-color: color-mix(in srgb, var(--store-color, #7A1F2E) 35%, transparent);
}

.page-container :deep([role='dialog']) {
  background: color-mix(in srgb, var(--store-color, #7A1F2E) 4%, #fff);
}

.page-container h1 {
  color: var(--store-color, #7A1F2E);
}
.content-item {
  color: white;
  font-size: large;
}
</style>
