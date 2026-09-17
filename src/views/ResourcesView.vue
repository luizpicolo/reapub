<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import { listLocalPleromaResources } from '../api/resources'
import type { Resource } from '../types'

const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const items = ref<Resource[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const pagesLoaded = ref(0)
const hasMore = ref(true)
let requestId = 0
let backgroundRequest: Promise<void> | null = null
let nextMaxId: string | undefined

function mergeResources(next: Resource[]) {
  if (!next.length) return
  const byId = new Map(items.value.map(item => [item.id, item]))
  for (const resource of next) byId.set(resource.id, resource)
  items.value = [...byId.values()].sort((a, b) =>
    (b.publishedAtTime || b.publishedAt).localeCompare(a.publishedAtTime || a.publishedAt),
  )
}

async function searchResources(value = query.value) {
  const currentRequest = ++requestId
  loading.value = true
  loadingMore.value = false
  error.value = ''
  items.value = []
  pagesLoaded.value = 0
  hasMore.value = true
  nextMaxId = undefined
  backgroundRequest = null

  try {
    // Render the first 40 local posts immediately. The remaining pages are
    // fetched afterwards so /resources does not stay blocked while scanning
    // the entire local timeline.
    await listLocalPleromaResources(value.trim(), {
      maxPages: 1,
      onPage: (pageResources, info) => {
        if (currentRequest !== requestId) return
        mergeResources(pageResources)
        pagesLoaded.value = info.page
        hasMore.value = info.hasMore
        nextMaxId = info.nextMaxId
        loading.value = false
      },
    })

    if (currentRequest !== requestId) return
    loading.value = false

    // Continue in the background so the catalog eventually contains all
    // local resources without making the initial screen wait for hundreds of
    // timeline requests.
    if (hasMore.value) {
      backgroundRequest = loadRemainingPages(value.trim(), currentRequest, nextMaxId)
      await backgroundRequest
    }
  } catch (err) {
    if (currentRequest !== requestId) return
    loading.value = false
    if (!items.value.length) {
      error.value = err instanceof Error ? err.message : 'Não foi possível carregar os recursos.'
    }
  }
}

async function loadRemainingPages(value: string, currentRequest: number, startMaxId?: string) {
  loadingMore.value = true
  try {
    // Skip the first page, which is already rendered, then continue scanning.
    await listLocalPleromaResources(value, {
      maxPages: 250,
      startMaxId,
      startPage: 2,
      onPage: (pageResources, info) => {
        if (currentRequest !== requestId) return
        mergeResources(pageResources)
        pagesLoaded.value = info.page
        hasMore.value = info.hasMore
      },
    })
  } catch (err) {
    if (currentRequest === requestId && !items.value.length) {
      error.value = err instanceof Error ? err.message : 'Não foi possível continuar carregando os recursos.'
    }
  } finally {
    if (currentRequest === requestId) {
      loadingMore.value = false
      hasMore.value = false
    }
  }
}

async function submitSearch() {
  const value = query.value.trim()
  await router.push({ path: '/resources', query: value ? { q: value } : {} })
  // The route watcher performs the request, avoiding duplicate API calls.
}

async function clearSearch() {
  query.value = ''
  await router.push({ path: '/resources', query: {} })
}

watch(
  () => route.query.q,
  async value => {
    const nextQuery = typeof value === 'string' ? value : ''
    if (nextQuery !== query.value) query.value = nextQuery
    await searchResources(nextQuery)
  },
)

onMounted(() => searchResources(query.value))
onBeforeUnmount(() => { requestId += 1 })
</script>

<template>
  <div class="page resources-page">
    <div class="section-head">
      <div>
        <div class="eyebrow">Catálogo local</div>
        <h2>Explorar recursos</h2>
        <p>Todos os recursos educacionais publicados localmente nesta instância.</p>
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
        <button v-if="query" class="search-clear" type="button" aria-label="Limpar busca" @click="clearSearch">
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

    <div v-if="loading && !items.length" class="card resource-search-state">
      <Search :size="24" />
      <strong>Carregando recursos locais...</strong>
      <p>Mostrando os primeiros resultados assim que a instância responder.</p>
    </div>

    <div v-else-if="error && !items.length" class="card resource-search-state">
      <Search :size="26" />
      <strong>Não foi possível carregar os recursos</strong>
      <p>{{ error }}</p>
      <button class="btn ghost" type="button" @click="searchResources(query)">Tentar novamente</button>
    </div>

    <div v-else-if="!items.length && !loadingMore" class="card resource-search-state">
      <Search :size="26" />
      <strong>Nenhum recurso encontrado</strong>
      <p>Não encontramos recursos para essa busca. Tente outro título, autor, área ou palavra-chave.</p>
      <button class="btn ghost" type="button" @click="clearSearch">Ver todos os recursos</button>
    </div>

    <template v-else>
      <div class="resource-catalog-meta">
        <span>{{ items.length }} recurso{{ items.length === 1 ? '' : 's' }} encontrado{{ items.length === 1 ? '' : 's' }}</span>
        <span v-if="loadingMore">Atualizando catálogo local…</span>
      </div>

      <div class="grid resource-results">
        <RouterLink v-for="resource in items" :key="resource.id" :to="`/resources/${resource.id}`" class="card resource-card">
          <span class="pill">{{ resource.area }}</span>
          <h3>{{ resource.title }}</h3>
          <p>{{ resource.description }}</p>
          <div class="source" style="margin-top: 16px">
            <div class="source-logo">{{ resource.sourcePlatform.name.slice(0, 1) }}</div>
            <div>
              <strong style="font-size: 13px">{{ resource.sourcePlatform.name }}</strong>
              <div style="font-size: 11px; color: #748079">por {{ resource.authors.map(author => author.name).join(', ') }}</div>
            </div>
          </div>
          <div class="resource-foot">
            <span>{{ resource.license }}</span>
            <span>✓ Verificado</span>
          </div>
        </RouterLink>
      </div>

      <div v-if="loadingMore" class="resource-loading-more">
        Carregando mais recursos locais… (página {{ pagesLoaded }})
      </div>
    </template>
  </div>
</template>
