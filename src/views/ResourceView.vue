<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ExternalLink, ShieldCheck, Download } from 'lucide-vue-next'
import { getResource } from '../api'
import { listMyPleromaResources } from '../api/resources'
import type { Resource } from '../types'

const route = useRoute()
const r = ref<Resource>()
const loading = ref(true)

onMounted(async () => {
  const id = String(route.params.id)
  try {
    r.value = await getResource(id)
    if (!r.value && id.startsWith('pleroma-')) {
      const resources = await listMyPleromaResources()
      r.value = resources.find(resource => resource.id === id)
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page" v-if="r">
    <div class="center">
      <div class="eyebrow">Recurso educacional aberto</div>
      <h1 style="font:600 42px 'Space Grotesk';margin:10px 0">{{ r.title }}</h1>
      <p class="lead" style="white-space:pre-line">{{ r.description }}</p>

      <div class="source" style="margin:25px 0">
        <div class="source-logo">{{ r.sourcePlatform.name.slice(0, 1) }}</div>
        <div><strong>{{ r.sourcePlatform.name }}</strong><div style="font-size:12px;color:#748079">Plataforma de origem · {{ r.authors.map(a => a.name).join(', ') }}</div></div>
        <a :href="r.originalUrl" target="_blank" rel="noopener noreferrer" style="margin-left:auto"><ExternalLink :size="17" /></a>
      </div>

      <div class="status ok">
        <strong>✓ Publicado na instância Pleroma</strong>
        <div style="font-size:13px;margin-top:5px">O recurso foi recuperado diretamente da publicação federada.</div>
      </div>

      <div class="detail-list">
        <div class="detail"><b>Arquivo</b>{{ r.fileName }}</div>
        <div class="detail"><b>Tamanho</b>{{ r.fileSize ? `${(r.fileSize / 1000000).toFixed(1)} MB` : 'Informado pela instância na publicação' }}</div>
        <div class="detail"><b>Licença</b>{{ r.license || 'Não informada' }}</div>
        <div class="detail"><b>Publicado</b>{{ r.publishedAt }}</div>
      </div>

      <div class="actions">
        <a class="btn primary" :href="r.originalUrl" target="_blank" rel="noopener noreferrer"><Download :size="17" /> Abrir arquivo/publicação</a>
        <a class="btn ghost" :href="r.originalUrl" target="_blank" rel="noopener noreferrer"><ExternalLink :size="17" /> Ver no Pleroma</a>
        <a class="btn ghost" href="/verify"><ShieldCheck :size="17" /> Verificar</a>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="page"><div class="center">Carregando recurso…</div></div>
  <div v-else class="page"><div class="center"><h2>Recurso não encontrado</h2><p>O recurso pode ter sido removido ou a sessão do Pleroma expirou.</p></div></div>
</template>
