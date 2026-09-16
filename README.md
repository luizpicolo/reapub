# REA.fed — frontend federado

MVP em Vue 3 + TypeScript de uma rede federada de Recursos Educacionais Abertos.

## Conceito

O REA.fed funciona como uma rede social federada: o usuário descobre e **segue plataformas**. As publicações das plataformas seguidas aparecem no feed, mantendo explícita a origem do recurso.

O frontend não implementa a federação nem a criptografia. Ele consome APIs externas e está organizado para que mocks possam ser substituídos por APIs reais.

## Tipos de feed

O frontend possui três tipos de feed:

### Local

Mostra somente as publicações da plataforma à qual o usuário pertence.

### Seguindo

Mostra as publicações das plataformas que o usuário segue.

Esse é o feed baseado na relação de acompanhamento da rede federada.

### Global

Mostra todos os recursos públicos disponíveis na federação.

Na implementação real, a API deverá retornar apenas publicações que sejam públicas.

## Fluxos principais

- Descobrir plataformas federadas
- Seguir/deixar de seguir plataformas
- Alternar entre os feeds Local, Seguindo e Global
- Ver as publicações das plataformas seguidas
- Abrir o perfil de uma plataforma e ver suas publicações
- Publicar recursos pela API externa
- Consultar recursos federados
- Verificar um recurso enviando o arquivo original + `manifest.js` + `.sig` + `.ots`

## APIs esperadas

A camada `src/api` contém o mock com operações conceituais como:

- `login`
- `listFeed`
- `getPlatforms`
- `getFollowing`
- `followPlatform`
- `unfollowPlatform`
- `listPlatformPublications`
- `publishResource`
- `verifyResource`

`listFeed` recebe um tipo de feed:

```ts
listFeed('local')
listFeed('following')
listFeed('global')
```

A implementação real deve substituir `src/api/mock.ts` sem acoplar os componentes Vue aos endpoints.

## Arquitetura

```text
Vue Views
    ↓
Pinia / Composables
    ↓
API Services
    ↓
APIs externas
    ├── Auth API
    ├── Resource API
    ├── Verification API
    ├── Federation API
    ├── Follow API
    └── Feed API
```

## Executar

```bash
npm install
npm run dev
```

## Observação

Os dados, autenticação, armazenamento, geração de evidências, assinatura e protocolo de federação são simulados. O frontend deve confiar nos resultados das APIs externas para decisões de autenticidade.

## Busca de recursos

A interface agora possui uma busca de recursos integrada ao frontend. A busca pode ser realizada pelo campo compacto do cabeçalho ou pela busca completa da página **Explorar recursos**.

A busca utiliza a camada de API (`listResources`) e considera título, descrição, área, tags, autor e plataforma de origem. O parâmetro de busca também fica disponível na URL (`/resources?q=...`), permitindo compartilhar ou recarregar uma pesquisa.

No ambiente real, a implementação deverá substituir o mock por uma API externa capaz de realizar a busca federada e devolver os resultados de acordo com os critérios da infraestrutura de federação.

## Configuração da instância Pleroma

A URL da instância é definida pelo administrador no arquivo `.env` e **não é solicitada ao usuário** durante login ou cadastro.

Exemplo:

```env
VITE_PLEROMA_INSTANCE_URL=https://social.exemplo.com.br
```

Para instalar o REA.fed em outra instância, altere `VITE_PLEROMA_INSTANCE_URL` no `.env` antes de executar o build/deploy:

```bash
npm install
npm run build
```

O valor `VITE_PLEROMA_INSTANCE_URL` é uma variável de ambiente do Vite e fica incorporado no bundle durante o build. Portanto, simplesmente editar `.env` depois que um `dist/` já foi gerado não altera uma instalação já compilada; é necessário gerar um novo build.
