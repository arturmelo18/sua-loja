<template>
  <nav class="navbar">
    <div class="nav-logo flex flex-wrap">
      <nuxt-link to="/">{{ storeName }}</nuxt-link>
    </div>

    <ul class="nav-links" id="nav-links-desktop">
      <li><nuxt-link to="/">Todos os produtos</nuxt-link></li>
    </ul>

    <div class="nav-actions">
      <el-button text type="info" @click="navigateTo('/cartPage')">
        <i class="uil uil-shopping-cart-alt"></i>
      </el-button>

      <el-dropdown>
        <el-button text type="info">
          <i class="uil uil-bars"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="flex flex-col items-start" v-if="authStore.getUser">
            <el-dropdown-item class="w-full nav-links-mobile-item" @click="navigateTo('/')">
              <i class="uil uil-apps"></i>
              <span>Todos os produtos</span>
            </el-dropdown-item>
            <el-dropdown-item class="w-full" @click="navigateTo('/userPage')">
              <i class="uil uil-user"></i>
              <span>Minha Conta</span>
            </el-dropdown-item>
            <el-dropdown-item class="w-full" @click="navigateTo('/myOrders')">
              <i class="uil uil-shopping-bag"></i>
              <span>Meus pedidos</span>
            </el-dropdown-item>
            <el-dropdown-item class="w-full" @click="navigateTo('/adminPage')" v-if="isAdmin && !isMobile">
              <i class="uil uil-setting"></i>
              <span>Área do administrador</span>
            </el-dropdown-item>
            <el-dropdown-item class="w-full" @click="logout">
              <i class="uil uil-signout"></i>
              <span>Sair</span>
            </el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu class="flex flex-col items-start" v-else>
            <el-dropdown-item class="w-full nav-links-mobile-item" @click="navigateTo('/')">
              <i class="uil uil-apps"></i>
              <span>Todos os produtos</span>
            </el-dropdown-item>
            <el-dropdown-item class="w-full" @click="navigateTo('/loginPage')">
              <i class="uil uil-signin"></i>
              <span>Entrar</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </nav>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const storeName = ref('Fatecano')
const isMobile = ref(false)

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(async () => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  try {
    const store = await $fetch<any>('/api/store/getStore')
    if (store?.name) storeName.value = store.name
  } catch {
    // mantém o fallback 'Fatecano'
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

const logout = () => {
  authStore.clearUser()
  ElMessage.success('O usuário saiu da conta com sucesso!')
  navigateTo('/')
}

const isAdmin = computed(() => {
  return authStore.getUser?.kind == 'admin'
})
</script>

<style scoped>
nav a {
  text-decoration: none;
  color: inherit;
}

.nav-logo a {
  text-decoration: none;
  color: inherit;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: transparent;
  color: var(--burgundy);
}

/* ===== NAVBAR (mobile first) ===== */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
}

.nav-logo {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 1.25rem;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Links de navegação horizontal: escondidos no mobile, aparecem no dropdown */
.nav-links {
  display: none;
  list-style: none;
  gap: 24px;
  margin: 0;
  padding: 0;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.nav-actions .el-button {
  padding: 8px;
}

.nav-actions i {
  font-size: 1.15rem;
}

/* Item "Todos os produtos" só aparece no dropdown mobile */
.nav-links-mobile-item {
  display: flex;
}

/* ===== TABLET / DESKTOP (>= 768px) ===== */
@media (min-width: 768px) {
  .navbar {
    padding: 16px 32px;
  }

  .nav-logo {
    font-size: 1.5rem;
  }

  .nav-links {
    display: flex;
  }

  .nav-actions .el-button {
    padding: 10px;
  }

  .nav-actions i {
    font-size: 1.3rem;
  }

  /* No desktop o link já está visível na barra, some do dropdown */
  .nav-links-mobile-item {
    display: none;
  }
}

/* ===== DESKTOP MAIOR (>= 1024px) ===== */
@media (min-width: 1024px) {
  .navbar {
    padding: 18px 48px;
  }

  .nav-links {
    gap: 32px;
  }
}
</style>