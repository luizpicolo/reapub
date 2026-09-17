<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AlertCircle, FileText, RefreshCw, ShieldCheck, Pencil, Trash2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { listMyPleromaResources } from '../api/resources'
import { deletePleromaResource } from '../api/resourceDeletion'
import type { Resource } from '../types'

const items = ref<Resource[]>([])
const loading = ref(true)
const error = ref('')
const actionError = ref('')
const deletingId = ref('')
const report = ref('')

async function loadResources() {
  loading.value = true
  error.value = ''
  try { items.value = await listMyPleromaResources() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível carregar os recursos.' }
  finally { loading.value = false }
}

function statusId(resource: Resource) {
  return resource.id.startsWith('pleroma-') ? resource.id.slice('pleroma-'.length) : ''
}

async function removeResource(resource: Resource) {
  const id = statusId(resource)
  if (!id || deletingId.value) return
  const confirmed = window.confirm(`EXCLUIR RECURSO\n\nTítulo: ${resource.title}\nArquivo: ${resource.fileName}\n\nEssa ação excluirá a publicação da sua instância Pleroma. A propagação para outros servidores ocorrerá de forma assíncrona e cópias IPFS remotas poderão continuar existindo.\n\nPressione OK para excluir ou Cancelar para manter o recurso.`)
  if (!confirmed) return
  deletingId.value = resource.id
  actionError.value = ''
  report.value = ''
  try {
    const result = await deletePleromaResource(id)
    report.value = [result.localDeletion.details, result.federation.details, ...result.warnings].join('\n')
    items.value = items.value.filter(item => item.id !== resource.id)
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Não foi possível excluir o recurso.'
  } finally { deletingId.value = '' }
}

onMounted(() => { void loadResources() })
</script>

<template>
  <div class="page">
    <div class="section-head">
      <div>
        <div class="eyebrow">Área do autor</div>
        <h2>Meus recursos</h2>
        <p>Todos os recursos publicados pelo REA.fed na sua conta Pleroma.</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn ghost" type="button" :disabled="loading" @click="loadResources">
          <RefreshCw :size="16" :class="loading ? 'spin' : ''" /> Atualizar
        </button>
        <RouterLink class="btn primary" to="/resources/new">+ Novo recurso</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="card resource-search-state">
      <RefreshCw :size="26" class="spin" />
      <strong>Carregando todos os recursos...</strong>
      <p>Consultando as publicações da sua conta no Pleroma.</p>
    </div>

    <div v-else-if="error" class="status bad">
      <strong><AlertCircle :size="18" /> Não foi possível carregar o dashboard</strong>
      <p>{{ error }}</p>
      <button class="btn ghost" type="button" @click="loadResources">Tentar novamente</button>
    </div>

    <template v-else>
      <div v-if="actionError" class="status bad"><strong>Erro na ação</strong><p>{{ actionError }}</p></div>
      <div v-if="report" class="status"><strong>Relatório da exclusão</strong><p style="white-space:pre-line">{{ report }}</p></div>

      <div class="dashboard-stats">
        <div class="card dashboard-stat"><FileText :size="22" /><div><strong>{{ items.length }}</strong><span>recursos cadastrados</span></div></div>
        <div class="card dashboard-stat"><ShieldCheck :size="22" /><div><strong>{{ items.filter(r => r.verification.authorship).length }}</strong><span>com autoria identificada</span></div></div>
      </div>

      <div v-if="!items.length" class="card resource-search-state">
        <FileText :size="28" /><strong>Nenhum recurso cadastrado</strong>
        <p>Publique um arquivo para que ele apareça aqui automaticamente.</p>
        <RouterLink class="btn primary" to="/resources/new">Publicar primeiro recurso</RouterLink>
      </div>

      <div v-else class="card" style="padding:0;overflow:hidden">
        <table class="table">
          <thead><tr><th>Recurso</th><th>Arquivo</th><th>Publicado</th><th>Integridade</th><th>Ação</th></tr></thead>
          <tbody>
            <tr v-for="r in items" :key="r.id">
              <td><strong>{{ r.title }}</strong><div style="font-size:11px;color:#78827d">{{ r.area || 'Sem área' }} · {{ r.type }}</div></td>
              <td>{{ r.fileName }}</td><td>{{ r.publishedAt }}</td>
              <td><span v-if="r.verification.integrity">✓ Verificado</span><span v-else style="color:#78827d">Pendente</span></td>
              <td style="display:flex;gap:8px;align-items:center">
                <RouterLink :to="`/resources/${r.id}/edit`" title="Editar recurso"><Pencil :size="16" /> Editar</RouterLink>
                <button class="btn ghost" type="button" :disabled="deletingId === r.id" @click="removeResource(r)"><Trash2 :size="16" /> {{ deletingId === r.id ? 'Excluindo...' : 'Excluir' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
