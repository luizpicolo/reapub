import { generateKeyPairSync } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const privateKeyPath = resolve(process.env.PRIVATE_KEY_PATH || './src/keys/private-key.pem')
const publicKeyPath = resolve(process.env.PUBLIC_KEY_PATH || './src/keys/public-key.pem')

await mkdir(dirname(privateKeyPath), { recursive: true })
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

await writeFile(privateKeyPath, privateKey, { mode: 0o600 })
await writeFile(publicKeyPath, publicKey, { mode: 0o644 })
console.log(`Chaves geradas em ${privateKeyPath} e ${publicKeyPath}`)
