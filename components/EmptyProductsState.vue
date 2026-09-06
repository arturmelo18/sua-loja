<template>
  <div class="empty-products">
    <div class="empty-products__icon" aria-hidden="true">
      <i class="uil uil-shopping-bag"></i>
    </div>
    <h3>Nenhum produto por enquanto</h3>
    <p>Novidades desta loja aparecerão aqui em breve.</p>
  </div>
</template>

<style scoped>
.empty-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  width: 100%;
  padding: 32px 20px;
  color: var(--store-color, #7A1F2E);
  text-align: center;
  background: color-mix(in srgb, var(--store-color, #7A1F2E) 5%, #fff);
  border: 1px solid color-mix(in srgb, var(--store-color, #7A1F2E) 18%, transparent);
}

.empty-products__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 18px;
  color: #fff;
  background: var(--store-color, #7A1F2E);
  border-radius: 50%;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--store-color, #7A1F2E) 22%, transparent);
}

.empty-products__icon i {
  font-size: 28px;
}

.empty-products h3 {
  margin: 0 0 6px;
  color: var(--store-color, #7A1F2E);
  font-size: 1.1rem;
  font-weight: 700;
}

.empty-products p {
  margin: 0;
  color: #6b6b6b;
  font-size: 0.9rem;
}
</style>
