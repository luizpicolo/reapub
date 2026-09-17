import { createPublicKey, generateKeyPairSync } from 'node:crypto'
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const KEYS_DIR = resolve(process.env.USER_KEYS_DIR || './src/keys/users')

function safeUserId(value) {
  const id = String(value || '').trim()
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('ID de usuário inválido.')
  return id
}

function pathsForUser(userId) {
  const id = safeUserId(userId)
  return {
    privateKeyPath: join(KEYS_DIR, `${id}-private-key.pem`),
    publicKeyPath: join(KEYS_DIR, `${id}-public-key.pem`),
  }
}

function publicKeyFromPrivate(privateKeyPem) {
  return createPublicKey(privateKeyPem).export({ type: 'spki', format: 'pem' }).toString()
}

async function exists(path) {
  try { await access(path); return true } catch { return false }
}

// A geração por usuário precisa ser atômica: duas requisições simultâneas nunca
// podem combinar a chave privada de um par com a pública de outro.
export async function ensureUserKeys(userId) {
  const paths = pathsForUser(userId)
  await mkdir(KEYS_DIR, { recursive: true })

  const hasPrivate = await exists(paths.privateKeyPath)
  const hasPublic = await exists(paths.publicKeyPath)

  if (hasPrivate && hasPublic) {
    // Corrige instalações antigas que possam ter ficado com um par inconsistente.
    // A chave privada é a fonte de verdade para novas assinaturas.
    const privateKey = await readFile(paths.privateKeyPath, 'utf8')
    const expectedPublic = publicKeyFromPrivate(privateKey)
    const currentPublic = await readFile(paths.publicKeyPath, 'utf8')
    if (expectedPublic !== currentPublic) {
      await writeFile(paths.publicKeyPath, expectedPublic, { mode: 0o644 })
    }
    return paths
  }

  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  // Escreve os dois arquivos temporariamente e publica o par somente depois.
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const privateTmp = `${paths.privateKeyPath}.${token}.tmp`
  const publicTmp = `${paths.publicKeyPath}.${token}.tmp`
  await writeFile(privateTmp, privateKey, { mode: 0o600, flag: 'wx' })
  await writeFile(publicTmp, publicKey, { mode: 0o644, flag: 'wx' })

  try {
    // Se outra requisição ganhou a corrida, usa o par que ela criou.
    if (!(await exists(paths.privateKeyPath))) await rename(privateTmp, paths.privateKeyPath)
    if (!(await exists(paths.publicKeyPath))) await rename(publicTmp, paths.publicKeyPath)
  } finally {
    await Promise.all([rm(privateTmp, { force: true }), rm(publicTmp, { force: true })])
  }

  // Garante que o par final é consistente mesmo sob concorrência.
  const finalPrivate = await readFile(paths.privateKeyPath, 'utf8')
  const expectedPublic = publicKeyFromPrivate(finalPrivate)
  const finalPublic = await readFile(paths.publicKeyPath, 'utf8')
  if (expectedPublic !== finalPublic) await writeFile(paths.publicKeyPath, expectedPublic, { mode: 0o644 })

  return paths
}

export async function getUserPublicKey(userId) {
  const { publicKeyPath } = await ensureUserKeys(userId)
  return readFile(publicKeyPath, 'utf8')
}

export async function getUserPrivateKey(userId) {
  const { privateKeyPath } = await ensureUserKeys(userId)
  return readFile(privateKeyPath, 'utf8')
}

export function getUserKeyPaths(userId) { return pathsForUser(userId) }
