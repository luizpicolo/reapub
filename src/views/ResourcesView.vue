<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import { listLocalPleromaResources } from '../api/resources'
import type { Resource } from '../types'

const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const items = ref<Resource[]>([])
const loading = ref(false)

async function searchResources(value = query.value) {
  loading.value = true

  try {
    items.value = await listLocalPleromaResources(value.trim())
  } finally {
    loading.value = false
  }
}

async function submitSearch() {
  const value = query.value.trim()

  await router.push({
    path: '/resources',
    query: value ? { q: value } : {},
  })

  await searchResources(value)
}

async function clearSearch() {
  query.value = ''

  await router.push({
    path: '/resources',
    query: {},
  })

  await searchResources('')
}

watch(
  () => route.query.q,
  async value => {
    const nextQuery = typeof value === 'string' ? value : ''

    if (nextQuery !== query.value) {
      query.value = nextQuery
    }

    await searchResources(nextQuery)
  },
)

onMounted(() => searchResources(query.value))
</script>

<template>
  <div class="page resources-page">
    <div class="section-head">
      <div>
        <div class="eyebrow">Catálogo local</div>
        <h2>Explorar recursos</h2>
        <p>
          Todos os recursos educacionais publicados localmente nesta instância.
        </p>
      </div>
    </div>

    <form class="resource-search" @submit.prevent="submitSearch">
      <div class="resource-search-input">
        <Search :size="19" />
        <input
          v-model="query"
          class="input"
          type="search"
          placeholder="Busque por título, autor, área, plataforma ou palavra-chave..."
          aria-label="Buscar recursos educacionais"
        />
        <button
          v-if="query"
          class="search-clear"
          type="button"
          aria-label="Limpar busca"
          @click="clearSearch"
        >
          <X :size="17" />
        </button>
      </div>

      <button class="btn primary search-submit" type="submit" :disabled="loading">
        <Search :size="16" />
        Buscar recursos
      </button>
    </form>

    <div v-if="query" class="search-summary">
      <strong>Resultados para:</strong>
      <span>“{{ query }}”</span>
      <button type="button" @click="clearSearch">Limpar busca</button>
    </div>

    <div v-if="loading" class="card resource-search-state">
      <Search :size="24" />
      <strong>Buscando recursos...</strong>
      <p>Consultando as fontes disponíveis pela API.</p>
    </div>

    <div v-else-if="!items.length" class="card resource-search-state">
      <Search :size="26" />
      <strong>Nenhum recurso encontrado</strong>
      <p>
        Não encontramos recursos para essa busca. Tente outro título, autor,
        área ou palavra-chave.
      </p>
      <button class="btn ghost" type="button" @click="clearSearch">
        Ver todos os recursos
      </button>
    </div>

    <div v-else class="grid resource-results">
      <RouterLink
        v-for="resource in items"
        :key="resource.id"
        :to="`/resources/${resource.id}`"
        class="card resource-card"
      >
        <span class="pill">{{ resource.area }}</span>

        <h3>{{ resource.title }}</h3>
        <p>{{ resource.description }}</p>

        <div class="source" style="margin-top: 16px">
          <div class="source-logo">
            {{ resource.sourcePlatform.name.slice(0, 1) }}
          </div>

          <div>
            <strong style="font-size: 13px">
              {{ resource.sourcePlatform.name }}
            </strong>
            <div style="font-size: 11px; color: #748079">
              por {{ resource.authors.map(author => author.name).join(', ') }}
            </div>
          </div>
        </div>

        <div class="resource-foot">
          <span>{{ resource.license }}</span>
          <span>✓ Verificado</span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
