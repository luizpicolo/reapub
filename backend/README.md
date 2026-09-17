# REA.fed — API Express, IPFS e autenticidade

O backend agora usa **Express.js** e mantém uma identidade criptográfica Ed25519 **por usuário Pleroma**.

## Como funciona

- O backend valida o Bearer token contra `/api/v1/accounts/verify_credentials`.
- O `account.id` retornado pelo Pleroma é usado como identificador estável do usuário.
- Na primeira autenticação, o backend cria automaticamente:
  - `src/keys/users/<id>-private-key.pem`
  - `src/keys/users/<id>-public-key.pem`
- A chave privada nunca é enviada ao navegador.
- Cada manifesto é assinado com a chave privada do usuário que fez o upload.
- O manifesto registra `signer.id`, `signer.username` e `signer.acct`.
- Na verificação, a assinatura é validada usando a chave pública pertencente ao `signer.id` do manifesto.

Isso elimina a chave global única que existia anteriormente.

## Instalação

```bash
cd backend
npm install
cp .env.example .env
# ajuste o .env
npm start
```

Não é mais necessário executar `npm run keys`. A criação das chaves é automática por usuário.

## Rotas

- `GET /health`
- `GET /api/resources/keys` — requer Bearer token; cria/retorna a chave pública do usuário autenticado.
- `GET /api/resources/public-key` — compatibilidade; requer Bearer token.
- `POST /api/resources/upload` — requer Bearer token e multipart: `file`, `title`, `author`, `version`.
- `POST /api/resources/verify` — multipart: `file`, `manifest`, `signature`, `ots`.

## Armazenamento

Por padrão, as chaves dos usuários ficam em:

```text
backend/src/keys/users/
```

Para usar outro diretório:

```env
USER_KEYS_DIR=/caminho/seguro/para/as/chaves
```

A chave privada deve permanecer somente no servidor e nunca deve ser versionada. Inclua `src/keys/users/` no `.gitignore`.

## Migração

A antiga:

```text
src/keys/private-key.pem
src/keys/public-key.pem
```

não é mais usada para assinar novos recursos.

Os recursos antigos continuam verificáveis apenas se a antiga chave pública ainda estiver disponível e se a verificação legada for implementada separadamente. Para novos recursos, a chave é sempre determinada pelo `signer.id`.

## Variáveis

As variáveis existentes continuam válidas. A principal nova opção é `USER_KEYS_DIR`.
