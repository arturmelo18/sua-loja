<template>
  <div class="gradient-divisor" />
</template>

<style scoped>
.gradient-divisor {
  width: 100%;
  height: 5px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--store-color, #7A1F2E) 62%, #000) 0%,
    var(--store-color, #7A1F2E) 35%,
    color-mix(in srgb, var(--store-color, #7A1F2E) 52%, #fff) 70%,
    color-mix(in srgb, var(--store-color, #7A1F2E) 18%, #fff) 100%
  );
}
</style>