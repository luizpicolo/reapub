import type { FederationPlatform, Resource } from '../types'
import { loadPleromaConfig, normalizeInstanceUrl, verifyPleromaConnection } from './pleroma'
import type { PleromaStatus } from './pleroma'

function platformFromStatus(instanceUrl: string, status: PleromaStatus): FederationPlatform {
  const host = new URL(normalizeInstanceUrl(instanceUrl)).host
  return { id: host, name: host, handle: `@${status.account.acct}`, url: normalizeInstanceUrl(instanceUrl), description: 'Instância Pleroma conectada ao REA.fed.', status: 'online', followersCount: 0, resourcesCount: 0, isFollowing: true }
}

function htmlToText(html = '') {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const normalized = html.replace(/<br\s*\/?>(\r?\n)?/gi, '\n').replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
  const doc = new DOMParser().parseFromString(normalized, 'text/html')
  return (doc.body.textContent || '').replace(/\u00a0/g, ' ')
}

function fileNameFromUrl(url?: string) {
  if (!url) return ''
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || '') } catch { return '' }
}

function parseResourceStatus(status: PleromaStatus, instanceUrl: string): Resource | null {
  const attachment = status.media_attachments?.[0]
  const text = htmlToText(status.content || '').replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean)
  if (!attachment || !text[0]?.startsWith('📚 ')) return null

  const title = text[0].replace(/^📚\s*/, '').trim() || attachment.filename || 'Recurso sem título'
  const metadata = new Map<string, string>()
  const descriptionLines: string[] = []
  const metadataPrefixes = ['Área:', 'Tipo:', 'Licença:']
  let inMetadata = false

  for (const line of text.slice(1)) {
    if (metadataPrefixes.some(prefix => line.startsWith(prefix))) {
      inMetadata = true
      const separator = line.indexOf(':')
      metadata.set(line.slice(0, separator), line.slice(separator + 1).trim())
      continue
    }
    if (/^(#\S+\s*)+$/.test(line)) continue
    if (!inMetadata) descriptionLines.push(line)
  }

  const tags = text.join(' ').match(/#[\p{L}\p{N}_-]+/gu)?.map(tag => tag.slice(1)) || []
  const platform = platformFromStatus(instanceUrl, status)
  const publishedAt = status.created_at || new Date().toISOString()

  return {
    id: `pleroma-${status.id}`,
    title,
    description: descriptionLines.join('\n'),
    authors: [{ id: status.account.id, name: status.account.display_name || status.account.username, platform }],
    publishedAt: publishedAt.slice(0, 10),
    publishedAtTime: publishedAt,
    language: 'pt-BR', area: metadata.get('Área') || '', type: metadata.get('Tipo') || 'Outro', license: metadata.get('Licença') || '', tags,
    fileName: attachment.filename || fileNameFromUrl(attachment.url) || 'arquivo',
    fileSize: 0, sourcePlatform: platform, originalUrl: status.url || status.uri || normalizeInstanceUrl(instanceUrl),
    verification: { overall: 'pending', integrity: false, signature: false, authorship: true, timestamp: true, details: ['Recurso carregado diretamente da postagem do Pleroma.'] },
    evidence: [], downloads: 0,
  }
}

async function fetchPleromaStatusesPage(config: ReturnType<typeof loadPleromaConfig>, accountId: string, maxId?: string) {
  const params = new URLSearchParams({ limit: '40', exclude_reblogs: 'true' })
  if (maxId) params.set('max_id', maxId)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(
      `${normalizeInstanceUrl(config.instanceUrl)}/api/v1/accounts/${encodeURIComponent(accountId)}/statuses?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${config.accessToken}` },
        signal: controller.signal,
      },
    )
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Pleroma respondeu HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}.`)
    }
    return await response.json() as PleromaStatus[]
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('A consulta ao Pleroma demorou mais de 15 segundos. Verifique a conexão, a URL da instância e o CORS.')
    }
    if (error instanceof TypeError) {
      throw new Error('Não foi possível consultar as publicações do Pleroma. Verifique a conexão e se a instância permite CORS.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function listLocalPleromaResources(query = ''): Promise<Resource[]> {
  const config = loadPleromaConfig()
  if (!config.instanceUrl || !config.accessToken) return []

  const resources: Resource[] = []
  let maxId: string | undefined
  const seen = new Set<string>()
  const seenCursors = new Set<string>()
  const search = query.trim().toLowerCase()

  // Read the local public timeline page by page so Explorar recursos
  // represents the complete local catalog instead of only the logged-in user.
  for (let page = 0; page < 250; page += 1) {
    const params = new URLSearchParams({
      limit: '40',
      local: 'true',
      exclude_reblogs: 'true',
    })
    if (maxId) params.set('max_id', maxId)

    const response = await fetch(
      `${normalizeInstanceUrl(config.instanceUrl)}/api/v1/timelines/public?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${config.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Pleroma respondeu HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}.`)
    }

    const statuses = await response.json() as PleromaStatus[]
    if (!statuses.length) break

    for (const status of statuses) {
      if (seen.has(status.id)) continue
      seen.add(status.id)
      const resource = parseResourceStatus(status, config.instanceUrl)
      if (!resource) continue

      if (!search || [
        resource.title,
        resource.description,
        resource.area,
        resource.type,
        resource.license,
        resource.fileName,
        ...resource.tags,
        ...resource.authors.map(author => author.name),
      ].join(' ').toLowerCase().includes(search)) {
        resources.push(resource)
      }
    }

    const nextMaxId = statuses[statuses.length - 1]?.id
    if (!nextMaxId || nextMaxId === maxId || seenCursors.has(nextMaxId)) break
    seenCursors.add(nextMaxId)
    maxId = nextMaxId
    if (statuses.length < 40) break
  }

  return resources.sort((a, b) =>
    (b.publishedAtTime || b.publishedAt).localeCompare(a.publishedAtTime || a.publishedAt),
  )
}

export async function listMyPleromaResources(): Promise<Resource[]> {
  const config = loadPleromaConfig()
  if (!config.instanceUrl || !config.accessToken) return []
  const { account } = await verifyPleromaConnection(config)
  const resources: Resource[] = []
  let maxId: string | undefined
  const seen = new Set<string>()
  const seenPageCursors = new Set<string>()

  // Pleroma/Mastodon APIs are paginated. Continue until the server returns
  // an empty page or stops advancing the cursor. The high safety limit avoids
  // an infinite loop if a non-standard instance returns the same page.
  for (let page = 0; page < 250; page += 1) {
    const statuses = await fetchPleromaStatusesPage(config, account.id, maxId)
    if (!statuses.length) break

    for (const status of statuses) {
      if (seen.has(status.id)) continue
      seen.add(status.id)
      const resource = parseResourceStatus(status, config.instanceUrl)
      if (resource) resources.push(resource)
    }

    const nextMaxId = statuses[statuses.length - 1]?.id
    if (!nextMaxId || nextMaxId === maxId || seenPageCursors.has(nextMaxId)) break
    seenPageCursors.add(nextMaxId)
    maxId = nextMaxId
    if (statuses.length < 40) break
  }

  return resources.sort((a, b) => (b.publishedAtTime || b.publishedAt).localeCompare(a.publishedAtTime || a.publishedAt))
}
