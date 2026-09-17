# REA.fed — Guia de uso com IPFS

O **REA.fed** é uma aplicação web para publicação e compartilhamento de Recursos Educacionais Abertos (REA) em uma rede Fediverso baseada em Pleroma.

A integração combina:

- **Vue + Vite** no frontend;
- **Pleroma** para usuários, OAuth, publicações e federação;
- **IPFS/Kubo** para armazenamento distribuído;
- **SHA-256** para verificar integridade;
- **Ed25519** para assinatura criptográfica do manifesto;
- **OpenTimestamps** para evidência temporal.

> O backend existente do Pleroma não precisa ser modificado. O serviço `backend/` é uma API complementar para tratar os arquivos e as provas criptográficas.

## 1. Fluxo de publicação

```text
Usuário
   ↓
REA.fed / Vue
   ↓ upload
API REA/IPFS
   ├── SHA-256
   ├── upload + pin no IPFS
   ├── manifesto
   ├── assinatura Ed25519
   └── OpenTimestamps
   ↓
CID + hash + provas
   ↓
Pleroma
   ↓
Publicação e federação
```

## 2. Requisitos

- Node.js 18 ou superior;
- npm;
- uma instância Pleroma acessível pela API;
- um nó Kubo/IPFS acessível pelo backend.

Exemplo de API Kubo:

```text
http://192.168.0.28:5001
```

A porta `5001` é a API administrativa do Kubo e não deve ser exposta diretamente à Internet.

## 3. Configurar o frontend

Na raiz do projeto, crie `.env`:

```env
VITE_PLEROMA_INSTANCE_URL=https://SEU-PLEROMA.example
VITE_REA_IPFS_API_URL=http://localhost:8787/api
VITE_IPFS_GATEWAY_URL=https://ipfs.io
```

`VITE_*` é incorporado ao frontend durante o build. Depois de alterar o `.env`, faça novo build.

## 4. Configurar o backend

Entre na pasta:

```bash
cd backend
```

Copie o exemplo:

```bash
cp .env.example .env
```

Configure, por exemplo:

```env
PORT=8787
PLEROMA_INSTANCE_URL=https://SEU-PLEROMA.example
IPFS_API_URL=http://192.168.0.28:5001
IPFS_GATEWAY_URL=https://ipfs.io
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE_MB=100
```

### Variáveis

| Variável | Função |
|---|---|
| `PORT` | Porta da API REA/IPFS |
| `PLEROMA_INSTANCE_URL` | Instância Pleroma usada para validar o usuário |
| `IPFS_API_URL` | API RPC do Kubo |
| `IPFS_GATEWAY_URL` | Gateway HTTP para abrir CIDs |
| `CORS_ORIGIN` | Origem autorizada do frontend |
| `MAX_FILE_SIZE_MB` | Limite de upload |

## 5. Instalar

Na raiz:

```bash
npm install
```

Depois:

```bash
cd backend
npm install
```

## 6. Gerar as chaves

A assinatura dos manifestos usa Ed25519.

Execute o script de geração de chaves disponível no backend, por exemplo:

```bash
npm run keys
```

ou:

```bash
npm run create:keys
```

O par de chaves fica em:

```text
backend/src/keys/private-key.pem
backend/src/keys/public-key.pem
```

### Segurança

A chave privada deve permanecer **somente no servidor**.

Nunca:

- coloque `private-key.pem` no frontend;
- publique a chave privada no GitHub;
- envie a chave privada para o navegador;
- coloque a chave privada em uma variável `VITE_*`.

Não gere um novo par de chaves a cada inicialização. O mesmo par deve ser preservado para que assinaturas antigas continuem verificáveis.

## 7. Iniciar o sistema

### Terminal 1 — backend

```bash
cd backend
npm run dev
```

A API ficará, normalmente, em:

```text
http://localhost:8787
```

### Terminal 2 — frontend

Na raiz do projeto:

```bash
npm run dev
```

O Vite normalmente ficará em:

```text
http://localhost:5173
```

## 8. Login

O login continua sendo feito pelo Pleroma.

O REA.fed utiliza o OAuth do Pleroma e recebe um `access_token`.

No upload, a API REA/IPFS utiliza esse token para consultar a identidade autenticada no Pleroma. Assim, o backend adicional não cria um segundo sistema de contas.

> OAuth e assinatura digital têm funções diferentes: OAuth autentica o usuário perante o Pleroma; Ed25519 assina o manifesto do recurso.

## 9. Publicar um recurso

O usuário seleciona o arquivo e preenche os metadados, por exemplo:

```text
Título: Livro de JavaScript
Área: Computação
Tipo: Livro
Licença: CC BY 4.0
Versão: 1.0.0
```

O frontend envia o arquivo para a API REA/IPFS.

O backend executa:

```text
1. recebe o arquivo
2. calcula SHA-256
3. envia para IPFS
4. faz pin do CID
5. cria o manifesto
6. assina o manifesto com Ed25519
7. cria a prova OpenTimestamps
8. devolve os resultados ao frontend
```

Depois disso, o REA.fed publica os dados no Pleroma.

## 10. Resultado

A resposta do upload contém informações semelhantes a:

```json
{
  "cid": "bafy...",
  "sha256": "8f14e45f...",
  "size": 123456,
  "manifest": {
    "title": "Livro de JavaScript",
    "author": "Luiz Picolo",
    "cid": "bafy...",
    "sha256": "8f14e45f...",
    "version": "1.0.0",
    "createdAt": "2026-01-01T12:00:00.000Z"
  },
  "signature": "...",
  "timestamp": "..."
}
```

Os valores reais dependem do arquivo e do momento da publicação.

## 11. CID e IPFS

O CID identifica o conteúdo no IPFS.

Exemplo:

```text
bafybeigd...
```

Para abrir pelo gateway configurado:

```text
https://SEU-GATEWAY/ipfs/bafybeigd...
```

O arquivo original permanece identificado pelo conteúdo no IPFS, enquanto o Pleroma é usado para publicação social e federação.

## 12. SHA-256

O SHA-256 é a impressão digital do arquivo.

Se o arquivo for alterado, o hash normalmente será diferente.

O hash registrado no manifesto permite comparar o arquivo recuperado com o arquivo publicado.

## 13. Manifesto e assinatura

O manifesto registra os dados essenciais do recurso:

```json
{
  "title": "Livro de JavaScript",
  "author": "Luiz Picolo",
  "cid": "bafy...",
  "sha256": "8f14e45f...",
  "version": "1.0.0",
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

O manifesto é assinado usando a chave privada Ed25519. A chave pública correspondente permite verificar a assinatura.

## 14. OpenTimestamps

O hash do manifesto também pode ser enviado ao OpenTimestamps para criar uma prova temporal `.ots`.

A confirmação de uma prova pode depender do processamento pelos calendários do OpenTimestamps.

## 15. Publicação no Pleroma

Depois do registro no IPFS, o REA.fed publica no Pleroma informações como:

```text
📚 Livro de JavaScript

Autor: Luiz Picolo
Área: Computação
Tipo: Livro
Licença: CC BY 4.0
Versão: 1.0.0

IPFS CID: bafy...
SHA-256: 8f14e45f...
```

O Pleroma continua responsável pelas contas, publicações e federação.

## 16. Verificação

A verificação de um recurso pode seguir esta sequência:

```text
Arquivo
  ↓
SHA-256
  ↓
Manifesto
  ↓
Assinatura Ed25519
  ↓
CID/IPFS
  ↓
Timestamp
```

O objetivo é verificar a integridade do arquivo, a correspondência com o manifesto, a validade da assinatura e, quando disponível, a prova temporal.

## 17. Teste do Kubo

Antes de publicar, confirme que o backend consegue acessar o Kubo:

```bash
curl http://192.168.0.28:5001/api/v0/version
```

Se estiver usando outro endereço, substitua na URL.

## 18. Teste rápido da API

Com o backend executando:

```bash
curl http://localhost:8787/health
```

Se a implementação estiver expondo esse endpoint, o retorno será semelhante a:

```json
{"ok":true}
```

## 19. Produção

Uma arquitetura recomendada é:

```text
Internet
   ↓
Reverse Proxy / HTTPS
   ├── /        → Vue
   └── /api     → API REA/IPFS
                       ├── Pleroma
                       └── Kubo :5001
```

Assim, o navegador não precisa acessar diretamente o Kubo.

### Importante

Não publique a API RPC do Kubo (`:5001`) diretamente na Internet. Ela é uma interface administrativa.

## 20. Solução de problemas

### Upload não chega ao IPFS

Teste:

```bash
curl http://SEU-IPFS:5001/api/v0/version
```

Confira também `IPFS_API_URL` no `.env` do backend.

### Token rejeitado

Confira `PLEROMA_INSTANCE_URL` e se o usuário está realmente autenticado no Pleroma.

### Erro de CORS

Confira `CORS_ORIGIN`. Em produção, use o domínio real do frontend.

### Assinatura inválida

Confirme que `private-key.pem` e `public-key.pem` pertencem ao mesmo par e que a chave privada não foi substituída.

### Arquivo está no IPFS, mas não foi publicado

IPFS e Pleroma são operações independentes:

```text
IPFS = armazenamento
Pleroma = publicação/federação
```

Primeiro verifique o resultado do upload e o CID. Depois confira a publicação no Pleroma.

## 21. Resumo da arquitetura

| Componente | Responsabilidade |
|---|---|
| Vue/REA.fed | Interface e interação com o usuário |
| Pleroma | Contas, OAuth, posts, follows e federação |
| API REA/IPFS | Upload, hash, manifesto, assinatura e timestamp |
| Kubo/IPFS | Armazenamento e recuperação do conteúdo |
| SHA-256 | Integridade |
| Ed25519 | Autenticidade do manifesto |
| OpenTimestamps | Evidência temporal |

O resultado é uma separação clara entre **identidade social**, **armazenamento do recurso**, **integridade**, **autenticidade do manifesto** e **evidência temporal**, sem necessidade de alterar o backend do Pleroma.
