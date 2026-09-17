import { createHash } from 'node:crypto'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { create } from 'kubo-rpc-client'

const CACHE_DIR = resolve(process.env.IPFS_CACHE_DIR || './data/cache/ipfs')
const MAX_CACHE_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 52428800)

let client
function getClient() {
  if (!client) {
    const url = process.env.IPFS_API_URL || 'http://127.0.0.1:5001'
    client = create({ url })
  }
  return client
}

function safeCid(cid) {
  const value = String(cid || '').trim()
  if (!value || !/^[a-zA-Z0-9]+$/.test(value) || value.length > 256) {
    throw new Error('CID IPFS inválido.')
  }
  return value
}

function cachePath(cid) {
  const key = createHash('sha256').update(safeCid(cid)).digest('hex')
  return join(CACHE_DIR, key)
}

export async function getCachedIpfsBuffer(cid) {
  const path = cachePath(cid)
  try {
    return await readFile(path)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return null
  }
}

export async function cacheIpfsBuffer(cid, buffer) {
  const path = cachePath(cid)
  await mkdir(CACHE_DIR, { recursive: true })
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempPath, buffer)
  await rename(tempPath, path).catch(async error => {
    if (error.code === 'EEXIST') return
    throw error
  })
  return path
}

export async function cacheIpfsFile(cid, sourcePath) {
  const buffer = await readFile(sourcePath)
  return cacheIpfsBuffer(cid, buffer)
}

export async function cacheEvidenceSet(resourceCid, entries) {
  const resourceKey = safeCid(resourceCid)
  const evidenceDir = join(CACHE_DIR, 'evidence', resourceKey)
  await mkdir(evidenceDir, { recursive: true })

  const saved = {}
  for (const [name, value] of Object.entries(entries || {})) {
    if (!value) continue
    const fileName = String(name).replace(/[^a-zA-Z0-9._-]/g, '_')
    const target = join(evidenceDir, fileName)
    await writeFile(target, Buffer.isBuffer(value) ? value : Buffer.from(value))
    saved[name] = target
  }
  return { directory: evidenceDir, files: saved }
}

export async function getCachedEvidenceSet(resourceCid) {
  const evidenceDir = join(CACHE_DIR, 'evidence', safeCid(resourceCid))
  const names = ['resource', 'manifest.json', 'assinatura.sig', 'prova.ots', 'chave-publica.pem']
  const result = {}
  for (const name of names) {
    try {
      result[name] = await readFile(join(evidenceDir, name))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return Object.keys(result).length ? result : null
}

export async function getIpfsBuffer(cid) {
  const cached = await getCachedIpfsBuffer(cid)
  if (cached) return { buffer: cached, source: 'local-cache' }

  const value = safeCid(cid)
  const chunks = []
  let total = 0
  for await (const chunk of getClient().cat(value)) {
    total += chunk.length
    if (total > MAX_CACHE_FILE_SIZE) {
      throw new Error(`O conteúdo IPFS ${value} excede o limite de ${Math.round(MAX_CACHE_FILE_SIZE / 1024 / 1024)} MB.`)
    }
    chunks.push(Buffer.from(chunk))
  }

  const buffer = Buffer.concat(chunks)
  await cacheIpfsBuffer(value, buffer)
  return { buffer, source: 'ipfs' }
}

export function getIpfsCacheDir() {
  return CACHE_DIR
}
