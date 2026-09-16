<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowRight,
  FileText,
  Globe2,
  House,
  Network,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import { getCurrentUser, getFollowing, listFeed } from '../api'
import type { FeedType, FederationPlatform, Publication, User } from '../types'

const route = useRoute()
const router = useRouter()

const items = ref<Publication[]>([])
const following = ref<FederationPlatform[]>([])
const currentUser = ref<User | null>(null)
const loading = ref(true)

const feedOptions: Array<{
  id: FeedType
  label: string
  description: string
}> = [
  {
    id: 'local',
    label: 'Local',
    description: 'Publicações da sua própria plataforma.',
  },
  {
    id: 'following',
    label: 'Seguindo',
    description: 'Publicações das plataformas que você segue.',
  },
  {
    id: 'global',
    label: 'Global',
    description: 'Todos os recursos públicos disponíveis na federação.',
  },
]

const activeFeed = computed<FeedType>(() => {
  const requested = route.query.feed

  if (requested === 'local' || requested === 'global' || requested === 'following') {
    return requested
  }

  return 'following'
})

const activeOption = computed(() =>
  feedOptions.find(option => option.id === activeFeed.value) ?? feedOptions[1],
)

const feedTitle = computed(() => {
  switch (activeFeed.value) {
    case 'local':
      return 'Feed local'
    case 'global':
      return 'Feed global'
    case 'following':
    default:
      return 'Seguindo'
  }
})

async function load() {
  loading.value = true

  try {
    const [publications, followedPlatforms, user] = await Promise.all([
      listFeed(activeFeed.value),
      getFollowing(),
      getCurrentUser(),
    ])

    items.value = publications
    following.value = followedPlatforms
    currentUser.value = user
  } finally {
    loading.value = false
  }
}

async function changeFeed(type: FeedType) {
  await router.replace({
    query: {
      ...route.query,
      feed: type,
    },
  })

  await load()
}

onMounted(load)

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <div class="page feed-page">
    <div class="feed-layout">
      <section>
        <div class="section-head feed-head">
          <div>
            <div class="eyebrow">Sua rede federada</div>
            <h2>{{ feedTitle }}</h2>
            <p>{{ activeOption.description }}</p>
          </div>

          <button class="btn ghost" type="button" @click="load">
            <RefreshCw :size="16" />
            Atualizar
          </button>
        </div>

        <div class="feed-tabs" role="tablist" aria-label="Tipos de feed">
          <button
            v-for="option in feedOptions"
            :key="option.id"
            class="feed-tab"
            :class="{ active: activeFeed === option.id }"
            type="button"
            role="tab"
            :aria-selected="activeFeed === option.id"
            @click="changeFeed(option.id)"
          >
            <House v-if="option.id === 'local'" :size="16" />
            <Users v-else-if="option.id === 'following'" :size="16" />
            <Globe2 v-else :size="16" />
            <span>{{ option.label }}</span>
          </button>
        </div>

        <div v-if="loading" class="card loading-box">
          Carregando publicações…
        </div>

        <div v-else-if="!items.length" class="card empty-box">
          <Network :size="26" />
          <strong>Nenhuma publicação encontrada</strong>
          <p>
            <template v-if="activeFeed === 'local'">
              Sua plataforma ainda não possui publicações.
            </template>
            <template v-else-if="activeFeed === 'following'">
              Siga algumas plataformas para receber novas publicações aqui.
            </template>
            <template v-else>
              Ainda não há recursos públicos disponíveis na federação.
            </template>
          </p>
          <RouterLink v-if="activeFeed === 'following'" class="btn primary" to="/federation">
            Explorar plataformas
          </RouterLink>
        </div>

        <div v-else class="feed-list">
          <article v-for="pub in items" :key="pub.id" class="card publication">
            <div class="publication-header">
              <div class="source-logo">
                {{ pub.sourcePlatform.name.slice(0, 1) }}
              </div>

              <div>
                <strong>{{ pub.sourcePlatform.name }}</strong>
                <div class="handle">
                  {{ pub.sourcePlatform.handle }} · {{ dateLabel(pub.publishedAt) }}
                </div>
              </div>

              <span class="federated-pill">
                <Network :size="13" />
                {{ pub.sourcePlatform.id === currentUser?.platform.id ? 'Local' : 'Federado' }}
              </span>
            </div>

            <div class="publication-body">
              <div class="eyebrow">Novo recurso</div>
              <h3>{{ pub.resource.title }}</h3>
              <p>{{ pub.resource.description }}</p>

              <div class="resource-meta">
                <span>
                  <FileText :size="14" />
                  {{ pub.resource.type }}
                </span>
                <span>{{ pub.resource.area }}</span>
                <span>{{ pub.resource.license }}</span>
              </div>

              <div class="source-line">
                <span>
                  por <strong>{{ pub.actorName }}</strong>
                </span>
                <span class="verified">
                  <ShieldCheck :size="14" />
                  Autoria verificável
                </span>
              </div>
            </div>

            <div class="publication-actions">
              <RouterLink class="btn primary" :to="`/resources/${pub.resource.id}`">
                Ver recurso
                <ArrowRight :size="15" />
              </RouterLink>

              <a
                :href="pub.sourcePlatform.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link"
              >
                Visitar plataforma de origem
              </a>
            </div>
          </article>
        </div>
      </section>

      <aside>
        <div class="card side-card">
          <div class="eyebrow">Sua rede</div>
          <h3>{{ following.length }} plataformas seguidas</h3>
          <p>
            As publicações dessas plataformas aparecem no feed <strong>Seguindo</strong>.
          </p>

          <RouterLink
            v-for="platform in following"
            :key="platform.id"
            :to="`/federation/${platform.id}`"
            class="mini-platform"
          >
            <span class="source-logo">
              {{ platform.name.slice(0, 1) }}
            </span>
            <span>
              <strong>{{ platform.name }}</strong>
              <small>{{ platform.handle }}</small>
            </span>
          </RouterLink>

          <RouterLink class="btn ghost full" to="/federation/following">
            Gerenciar seguindo
          </RouterLink>
        </div>

        <div class="card side-card feed-help-card">
          <div class="feed-help-item">
            <House :size="18" />
            <div>
              <strong>Local</strong>
              <p>Mostra apenas o que foi publicado na sua plataforma.</p>
            </div>
          </div>

          <div class="feed-help-item">
            <Users :size="18" />
            <div>
              <strong>Seguindo</strong>
              <p>Mostra as publicações das plataformas que você acompanha.</p>
            </div>
          </div>

          <div class="feed-help-item">
            <Globe2 :size="18" />
            <div>
              <strong>Global</strong>
              <p>Mostra todos os recursos públicos disponíveis na federação.</p>
            </div>
          </div>
        </div>

        <div class="card side-card">
          <Network :size="21" />
          <h3>Como a federação funciona?</h3>
          <p>
            Você segue plataformas e recebe suas publicações sem precisar acessar cada
            instância separadamente. A origem de cada recurso continua explícita.
          </p>
          <RouterLink class="text-link" to="/federation">
            Conhecer a federação →
          </RouterLink>
        </div>
      </aside>
    </div>
  </div>
</template>
