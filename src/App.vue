<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BookOpen,
  House,
  Network,
  Search,
  Users,
  ShieldCheck,
  Upload,
} from 'lucide-vue-next'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
onMounted(() => { void auth.hydrate() })
const route = useRoute()
const router = useRouter()
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')

watch(
  () => route.query.q,
  value => {
    searchQuery.value = typeof value === 'string' ? value : ''
  },
)

async function submitSearch() {
  const query = searchQuery.value.trim()

  await router.push({
    path: '/resources',
    query: query ? { q: query } : {},
  })
}
</script>

<template>
  <header>
    <div class="nav">
      <RouterLink to="/" class="brand">
        <span class="brandmark">
          <BookOpen :size="20" />
        </span>
        <span>REA<span class="muted">.fed</span></span>
      </RouterLink>

      <nav>
        <RouterLink v-if="auth.isAuthenticated" to="/feed">
          <House :size="15" />
          Feed
        </RouterLink>

        <RouterLink v-if="auth.isAuthenticated" to="/users">
          <Users :size="15" />
          Pessoas
        </RouterLink>

        <RouterLink to="/resources">
          <Search :size="15" />
          Explorar
        </RouterLink>

        <RouterLink to="/federation">
          <Network :size="15" />
          Plataformas
        </RouterLink>

        <RouterLink to="/verify">
          <ShieldCheck :size="15" />
          Verificar
        </RouterLink>

        <RouterLink v-if="auth.isAuthenticated" to="/resources/new">
          <Upload :size="15" />
          Publicar
        </RouterLink>
      </nav>

      <form class="nav-search" @submit.prevent="submitSearch">
        <Search :size="15" />
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Buscar recursos"
          placeholder="Buscar recursos..."
        />
      </form>

      <div class="nav-actions">
        <RouterLink v-if="!auth.isAuthenticated" class="btn ghost" to="/login">
          Entrar
        </RouterLink>

        <template v-else>
          <RouterLink class="avatar" to="/profile">
            {{ auth.user?.name.slice(0, 1) }}
          </RouterLink>
          <button class="btn ghost" type="button" @click="auth.signOut()">Sair</button>
        </template>
      </div>
    </div>
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <div>
      <strong>REA.fed</strong>
      <span> Recursos educacionais abertos em uma rede federada.</span>
    </div>
    <span>Frontend demonstrativo · APIs externas</span>
  </footer>
</template>
