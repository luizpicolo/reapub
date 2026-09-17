<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Swal from 'sweetalert2'
import { AlertCircle, FileText, RefreshCw, ShieldCheck, Pencil, Trash2, Eye } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { listMyPleromaResources } from '../api/resources'
import { deletePleromaResource } from '../api/resourceDeletion'
import type { Resource } from '../types'

const router = useRouter()
const items = ref<Resource[]>([])
const loading = ref(true)
const error = ref('')
const deletingId = ref('')

async function loadResources() {
  loading.value = true
  error.value = ''
  try { items.value = await listMyPleromaResources() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível carregar os recursos.' }
  finally { loading.value = false }
}

function statusId(r: Resource) { return r.id.startsWith('pleroma-') ? r.id.slice(8) : '' }
function editResource(r: Resource) { void router.push(`/resources/${encodeURIComponent(r.id)}/edit`) }

async function removeResource(r: Resource) {
  const id = statusId(r)
  if (!id || deletingId.value) return
  const confirm = await Swal.fire({ icon: 'warning', title: 'Excluir recurso?', text: 'Essa ação não pode ser desfeita.', showCancelButton: true, confirmButtonText: 'Excluir', cancelButtonText: 'Cancelar' })
  if (!confirm.isConfirmed) return
  deletingId.value = r.id
  try {
    await deletePleromaResource(id)
    items.value = items.value.filter(x => x.id !== r.id)
    await Swal.fire({ icon: 'success', title: 'Excluído', text: 'Recurso excluído.', confirmButtonText: 'OK' })
  } catch (e) { await Swal.fire({ icon: 'error', title: 'Erro', text: e instanceof Error ? e.message : 'Não foi possível excluir.', confirmButtonText: 'OK' }) }
  finally { deletingId.value = '' }
}

onMounted(() => void loadResources())
</script>
<template><div class="page"><div class="section-head"><div><div class="eyebrow">Área do autor</div><h2>Meus recursos</h2><p>Todos os recursos publicados pelo REA.fed na sua conta Pleroma.</p></div><div style="display:flex;gap:10px;align-items:center"><button type="button" class="btn ghost" :disabled="loading" @click="loadResources"><RefreshCw :size="16"/> Atualizar</button><RouterLink class="btn primary" to="/resources/new">+ Novo recurso</RouterLink></div></div><div v-if="loading" class="card resource-search-state"><RefreshCw :size="26" class="spin"/><strong>Carregando...</strong></div><div v-else-if="error" class="status bad"><strong><AlertCircle :size="18"/> Erro</strong><p>{{error}}</p><button type="button" class="btn ghost" @click="loadResources">Tentar novamente</button></div><template v-else><div class="dashboard-stats"><div class="card dashboard-stat"><FileText :size="22"/><div><strong>{{items.length}}</strong><span>recursos cadastrados</span></div></div><div class="card dashboard-stat"><ShieldCheck :size="22"/><div><strong>{{items.filter(r=>r.verification.authorship).length}}</strong><span>com autoria identificada</span></div></div></div><div v-if="!items.length" class="card resource-search-state"><FileText :size="28"/><strong>Nenhum recurso cadastrado</strong></div><div v-else class="card" style="padding:0;overflow:hidden"><table class="table"><thead><tr><th>Recurso</th><th>Arquivo</th><th>Publicado</th><th>Integridade</th><th>Ação</th></tr></thead><tbody><tr v-for="r in items" :key="r.id"><td><strong>{{r.title}}</strong><div style="font-size:11px;color:#78827d">{{r.area||'Sem área'}} · {{r.type}}</div></td><td>{{r.fileName}}</td><td>{{r.publishedAt}}</td><td>{{r.verification.integrity?'✓ Verificado':'Pendente'}}</td><td style="display:flex;gap:8px;align-items:center"><RouterLink :to="`/resources/${r.id}`" title="Visualizar recurso" @click.stop><Eye :size="16"/> Visualizar</RouterLink><a href="#" title="Editar recurso" @click.prevent.stop="editResource(r)"><Pencil :size="16"/> Editar</a><button type="button" class="btn ghost" :disabled="deletingId===r.id" @click.stop="removeResource(r)"><Trash2 :size="16"/> Excluir</button></td></tr></tbody></table></div></template></div></template>
