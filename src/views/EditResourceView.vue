<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { listMyPleromaResources } from '../api/resources'
import { loadPleromaConfig, normalizeInstanceUrl } from '../api/pleroma'
import type { Resource } from '../types'
const route = useRoute(); const router = useRouter()
const form = reactive({ title: '', description: '', area: '', type: '', license: '', tags: '' })
const loading = ref(true); const saving = ref(false); const error = ref('')
const statusId = () => { const id = String(route.params.id); return id.startsWith('pleroma-') ? id.slice(8) : id }
function buildStatusContent(originalContent = '') {
  const lines = originalContent.replace(/<[^>]+>/g, '\n').split('\n').map(line => line.trim()).filter(Boolean)
  const preserved = lines.filter(line => /^(IPFS|SHA-256|Manifesto|Assinatura|Chave pública|Timestamp OTS):/.test(line))
  const tags = form.tags.split(/[\s,]+/).map(tag => tag.trim().replace(/^#/, '')).filter(Boolean).map(tag => `#${tag}`).join(' ')
  return [`📚 ${form.title.trim()}`, '', form.description.trim(), '', `Área: ${form.area.trim()}`, `Tipo: ${form.type.trim()}`, `Licença: ${form.license.trim()}`, ...preserved, ...(tags ? ['', tags] : [])].join('\n')
}
async function save() {
  saving.value = true; error.value = ''
  try {
    const config = loadPleromaConfig(); const id = statusId()
    const currentResponse = await fetch(`${normalizeInstanceUrl(config.instanceUrl)}/api/v1/statuses/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${config.accessToken.trim()}`, Accept: 'application/json' } })
    if (!currentResponse.ok) throw new Error('Não foi possível recuperar a publicação original.')
    const current = await currentResponse.json() as { content?: string; media_attachments?: Array<{ id: string }> }
    const body = new URLSearchParams(); body.set('status', buildStatusContent(current.content || '')); body.set('visibility', 'public')
    for (const media of current.media_attachments || []) body.append('media_ids[]', media.id)
    const response = await fetch(`${normalizeInstanceUrl(config.instanceUrl)}/api/v1/statuses/${encodeURIComponent(id)}`, { method: 'PUT', headers: { Authorization: `Bearer ${config.accessToken.trim()}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: body.toString() })
    if (!response.ok) throw new Error('Não foi possível salvar as alterações.')
    await Swal.fire({ icon: 'success', title: 'Salvo', text: 'Alterações salvas e anexo preservado.', confirmButtonText: 'OK' }); await router.push(`/resources/${route.params.id}`)
  } catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível salvar.'; await Swal.fire({ icon: 'error', title: 'Erro', text: error.value, confirmButtonText: 'OK' }) } finally { saving.value = false }
}
onMounted(async () => { try { const resource = (await listMyPleromaResources()).find((item: Resource) => item.id === String(route.params.id)); if (!resource) throw new Error('Recurso não encontrado.'); Object.assign(form, { title: resource.title, description: resource.description, area: resource.area, type: resource.type, license: resource.license, tags: resource.tags.join(', ') }) } catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível carregar o recurso.'; await Swal.fire({ icon: 'error', title: 'Erro', text: error.value, confirmButtonText: 'OK' }) } finally { loading.value = false } })
</script>
<template><main class="page edit-page"><div class="center edit-container"><div class="eyebrow">Editar recurso</div><h1>Alterar informações</h1><p class="edit-intro">Atualize os dados básicos do recurso publicado.</p><div v-if="loading" class="card edit-card">Carregando...</div><section v-else class="card edit-card"><form class="edit-form" @submit.prevent="save"><div class="field-group"><label>Título</label><input v-model="form.title" required /></div><div class="field-group"><label>Descrição</label><textarea v-model="form.description" rows="5" required /></div><div class="form-grid"><div class="field-group"><label>Área/categoria</label><input v-model="form.area" /></div><div class="field-group"><label>Tipo</label><input v-model="form.type" /></div><div class="field-group"><label>Licença</label><input v-model="form.license" /></div><div class="field-group"><label>Tags</label><input v-model="form.tags" /></div></div><div v-if="error" class="status bad">{{ error }}</div><div class="form-actions"><button class="btn primary" type="submit" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar alterações' }}</button><button class="btn ghost" type="button" @click="router.back()">Cancelar</button></div></form></section></div></main></template>
<style scoped>.edit-page{padding:36px 20px 56px}.edit-container{max-width:820px;margin:auto}.edit-intro{margin:8px 0 24px;color:var(--muted,#667085)}.edit-card{padding:28px;border-radius:16px}.edit-form{display:grid;gap:20px}.field-group{display:grid;gap:8px}.field-group label{font-weight:600}.field-group input,.field-group textarea{width:100%;box-sizing:border-box;border:1px solid var(--border,#d0d5dd);border-radius:10px;padding:12px 14px;font:inherit;background:var(--surface,#fff);color:inherit}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.form-actions{display:flex;gap:12px;flex-wrap:wrap}@media(max-width:640px){.form-grid{grid-template-columns:1fr}.edit-card{padding:20px}}</style>
