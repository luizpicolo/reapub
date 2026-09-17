import { readFile } from 'node:fs/promises'
import { createHash, verify } from 'node:crypto'

function decodeSignature(value) {
  if (Buffer.isBuffer(value)) {
    const text = value.toString('utf8').trim()
    // A .sig produced by this project is base64 text. Accept raw 64-byte
    // Ed25519 signatures too, which makes verification compatible with
    // other producers that store the signature as binary.
    if (value.length === 64) return value
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return Buffer.from(text, 'base64')
    return value
  }

  const text = String(value ?? '').trim()
  if (!text) throw new Error('Arquivo de assinatura vazio.')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) throw new Error('A assinatura não está em Base64 válido.')
  const signature = Buffer.from(text, 'base64')
  if (signature.length !== 64) throw new Error(`Assinatura Ed25519 com tamanho inválido (${signature.length} bytes; esperado 64).`)
  return signature
}

export function verifyManifestSignatureWithPublicKey(manifestBuffer, signatureValue, publicKeyPem) {
  const signature = decodeSignature(signatureValue)
  if (signature.length !== 64) throw new Error(`Assinatura Ed25519 com tamanho inválido (${signature.length} bytes; esperado 64).`)
  return verify(null, manifestBuffer, publicKeyPem, signature)
}

// Compatibilidade com versões/implementações que assinaram o SHA-256 do
// manifesto em vez dos bytes do manifesto. A implementação oficial continua
// assinando os bytes exatos de manifest.json.
export function verifyManifestSignatureCompatible(manifestBuffer, signatureValue, publicKeyPem) {
  const signature = decodeSignature(signatureValue)
  if (signature.length !== 64) throw new Error(`Assinatura Ed25519 com tamanho inválido (${signature.length} bytes; esperado 64).`)

  const candidates = [
    manifestBuffer,
    createHash('sha256').update(manifestBuffer).digest(),
    Buffer.from(createHash('sha256').update(manifestBuffer).digest('hex'), 'utf8'),
  ]

  for (const payload of candidates) {
    if (verify(null, payload, publicKeyPem, signature)) {
      return payload === manifestBuffer ? 'manifest' : 'sha256-manifest'
    }
  }
  return false
}

export async function verifyManifestSignature(manifestBuffer, signatureBase64, publicKeyPath) {
  const publicKey = await readFile(publicKeyPath, 'utf8')
  return verifyManifestSignatureWithPublicKey(manifestBuffer, signatureBase64, publicKey)
}
