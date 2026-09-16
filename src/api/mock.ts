import type {
  FeedType,
  FederationPlatform,
  Follow,
  Publication,
  Resource,
  User,
  VerificationStatus,
} from '../types'

const platformA: FederationPlatform = {
  id: 'rea-br',
  name: 'REA Brasil',
  handle: '@rea-br.example',
  url: 'https://rea.example.org',
  description: 'Rede nacional de Recursos Educacionais Abertos.',
  status: 'online',
  followersCount: 1280,
  resourcesCount: 428,
  isFollowing: true,
}

const platformB: FederationPlatform = {
  id: 'universidade-x',
  name: 'REA Universidade X',
  handle: '@rea-universidade-x.example',
  url: 'https://rea.universidade.example',
  description:
    'Recursos educacionais produzidos e compartilhados pela comunidade universitária.',
  status: 'online',
  followersCount: 324,
  resourcesCount: 186,
  isFollowing: true,
}

const platformC: FederationPlatform = {
  id: 'if-sul',
  name: 'REA Instituto Federal Sul',
  handle: '@rea-if-sul.example',
  url: 'https://rea.ifsul.example',
  description: 'Materiais abertos para ensino, pesquisa e extensão.',
  status: 'online',
  followersCount: 587,
  resourcesCount: 241,
  isFollowing: false,
}

const platformD: FederationPlatform = {
  id: 'rede-docente',
  name: 'Rede Docente Aberta',
  handle: '@rede-docente.example',
  url: 'https://rede-docente.example',
  description:
    'Comunidade independente de educadores compartilhando recursos abertos.',
  status: 'online',
  followersCount: 913,
  resourcesCount: 367,
  isFollowing: false,
}

const resources: Resource[] = [
  {
    id: 'rea-001',
    title: 'Introdução à Física',
    description: 'Material introdutório sobre conceitos fundamentais de física.',
    authors: [{ id: 'u1', name: 'João da Silva' }],
    publishedAt: '2026-09-14',
    publishedAtTime: '2026-09-14T08:40:00-03:00',
    language: 'pt-BR',
    area: 'Física',
    type: 'Apostila',
    license: 'CC BY 4.0',
    tags: ['física', 'ensino médio'],
    fileName: 'introducao-fisica.pdf',
    fileSize: 2400000,
    sourcePlatform: platformA,
    originalUrl: 'https://rea.example.org/resources/rea-001',
    verification: {
      overall: 'verified',
      integrity: true,
      signature: true,
      authorship: true,
      timestamp: true,
      details: [
        'Arquivo corresponde ao manifesto.',
        'Assinatura digital válida.',
        'Evidência temporal confirmada.',
      ],
    },
    evidence: [
      { type: 'manifest', name: 'manifest.js', status: 'valid' },
      { type: 'signature', name: 'resource.sig', status: 'valid' },
      { type: 'ots', name: 'resource.ots', status: 'valid' },
    ],
    downloads: 128,
  },
  {
    id: 'rea-002',
    title: 'Apostila de Matemática',
    description: 'Material aberto para apoio ao ensino de matemática.',
    authors: [{ id: 'u2', name: 'Maria Oliveira' }],
    publishedAt: '2026-09-13',
    publishedAtTime: '2026-09-13T18:20:00-03:00',
    language: 'pt-BR',
    area: 'Matemática',
    type: 'Apostila',
    license: 'CC BY-SA 4.0',
    tags: ['matemática'],
    fileName: 'matematica.pdf',
    fileSize: 5200000,
    sourcePlatform: platformB,
    originalUrl: 'https://rea.universidade.example/resources/rea-002',
    verification: {
      overall: 'verified',
      integrity: true,
      signature: true,
      authorship: true,
      timestamp: true,
      details: [
        'Arquivo corresponde ao manifesto.',
        'Assinatura digital válida.',
        'Evidência temporal confirmada.',
      ],
    },
    evidence: [
      { type: 'manifest', name: 'manifest.js', status: 'valid' },
      { type: 'signature', name: 'resource.sig', status: 'valid' },
      { type: 'ots', name: 'resource.ots', status: 'valid' },
    ],
    downloads: 74,
  },
  {
    id: 'rea-003',
    title: 'Laboratório de Ciências em Casa',
    description:
      'Atividades experimentais de baixo custo para o ensino de ciências.',
    authors: [{ id: 'u3', name: 'Ana Ribeiro' }],
    publishedAt: '2026-09-13',
    publishedAtTime: '2026-09-13T14:05:00-03:00',
    language: 'pt-BR',
    area: 'Ciências',
    type: 'Atividade',
    license: 'CC BY 4.0',
    tags: ['ciências', 'experimentos'],
    fileName: 'laboratorio-casa.pdf',
    fileSize: 1800000,
    sourcePlatform: platformC,
    originalUrl: 'https://rea.ifsul.example/resources/rea-003',
    verification: {
      overall: 'verified',
      integrity: true,
      signature: true,
      authorship: true,
      timestamp: true,
      details: [
        'Arquivo corresponde ao manifesto.',
        'Assinatura digital válida.',
        'Evidência temporal confirmada.',
      ],
    },
    evidence: [
      { type: 'manifest', name: 'manifest.js', status: 'valid' },
      { type: 'signature', name: 'resource.sig', status: 'valid' },
      { type: 'ots', name: 'resource.ots', status: 'valid' },
    ],
    downloads: 51,
  },
  {
    id: 'rea-004',
    title: 'Guia de Projetos Interdisciplinares',
    description:
      'Sugestões para integrar diferentes áreas em projetos escolares.',
    authors: [{ id: 'u4', name: 'Carlos Mendes' }],
    publishedAt: '2026-09-12',
    publishedAtTime: '2026-09-12T10:10:00-03:00',
    language: 'pt-BR',
    area: 'Pedagogia',
    type: 'Guia',
    license: 'CC BY-SA 4.0',
    tags: ['projetos', 'interdisciplinar'],
    fileName: 'projetos-interdisciplinares.pdf',
    fileSize: 3200000,
    sourcePlatform: platformD,
    originalUrl: 'https://rede-docente.example/resources/rea-004',
    verification: {
      overall: 'verified',
      integrity: true,
      signature: true,
      authorship: true,
      timestamp: true,
      details: [
        'Arquivo corresponde ao manifesto.',
        'Assinatura digital válida.',
        'Evidência temporal confirmada.',
      ],
    },
    evidence: [
      { type: 'manifest', name: 'manifest.js', status: 'valid' },
      { type: 'signature', name: 'resource.sig', status: 'valid' },
      { type: 'ots', name: 'resource.ots', status: 'valid' },
    ],
    downloads: 93,
  },
]

const user: User = {
  id: 'u-demo',
  name: 'Luiz Fernando',
  email: 'usuario@example.org',
  platform: platformA,
  followingPlatformIds: [platformB.id],
}

const follows: Follow[] = [
  {
    id: 'follow-1',
    followerId: user.id,
    followingPlatformId: platformB.id,
    createdAt: '2026-09-02',
  },
]

const wait = (ms = 280) => new Promise(resolve => setTimeout(resolve, ms))

function allPlatforms(): FederationPlatform[] {
  return [platformA, platformB, platformC, platformD]
}

function syncPlatformFollowing() {
  for (const platform of allPlatforms()) {
    platform.isFollowing = user.followingPlatformIds.includes(platform.id)
  }
}

function makePublication(resource: Resource): Publication {
  return {
    id: `pub-${resource.id}`,
    resource,
    publishedAt:
      resource.publishedAtTime || `${resource.publishedAt}T12:00:00-03:00`,
    sourcePlatform: resource.sourcePlatform,
    actorName: resource.authors.map(author => author.name).join(', '),
    summary: `${resource.sourcePlatform.name} publicou um novo recurso.`,
  }
}

export async function login(email: string): Promise<User> {
  await wait()
  syncPlatformFollowing()

  return {
    ...user,
    email,
    followingPlatformIds: [...user.followingPlatformIds],
  }
}

export async function getCurrentUser(): Promise<User> {
  await wait(100)
  syncPlatformFollowing()

  return {
    ...user,
    followingPlatformIds: [...user.followingPlatformIds],
  }
}

export async function listResources(q = ''): Promise<Resource[]> {
  await wait()

  const search = q.toLowerCase()

  return resources.filter(resource =>
    [
      resource.title,
      resource.description,
      resource.area,
      ...resource.tags,
      resource.authors.map(author => author.name),
      resource.sourcePlatform.name,
    ]
      .flat()
      .join(' ')
      .toLowerCase()
      .includes(search),
  )
}

export async function getResource(id: string): Promise<Resource | undefined> {
  await wait()
  return resources.find(resource => resource.id === id)
}

export async function getPlatforms(): Promise<FederationPlatform[]> {
  await wait()
  syncPlatformFollowing()

  return allPlatforms().map(platform => ({
    ...platform,
    isFollowing: user.followingPlatformIds.includes(platform.id),
  }))
}

export async function getFollowing(): Promise<FederationPlatform[]> {
  await wait()
  syncPlatformFollowing()

  return allPlatforms()
    .filter(platform => user.followingPlatformIds.includes(platform.id))
    .map(platform => ({ ...platform }))
}

export async function getPlatform(
  id: string,
): Promise<FederationPlatform | undefined> {
  await wait()
  syncPlatformFollowing()

  const platform = allPlatforms().find(item => item.id === id)
  return platform ? { ...platform } : undefined
}

export async function followPlatform(id: string): Promise<FederationPlatform> {
  await wait(400)

  if (!user.followingPlatformIds.includes(id)) {
    user.followingPlatformIds.push(id)
    follows.push({
      id: `follow-${Date.now()}`,
      followerId: user.id,
      followingPlatformId: id,
      createdAt: new Date().toISOString(),
    })
  }

  syncPlatformFollowing()

  const platform = allPlatforms().find(item => item.id === id)!
  platform.followersCount++
  platform.isFollowing = true

  return { ...platform }
}

export async function unfollowPlatform(id: string): Promise<FederationPlatform> {
  await wait(300)

  user.followingPlatformIds = user.followingPlatformIds.filter(item => item !== id)
  syncPlatformFollowing()

  const platform = allPlatforms().find(item => item.id === id)!
  platform.followersCount = Math.max(0, platform.followersCount - 1)
  platform.isFollowing = false

  return { ...platform }
}

export async function listFeed(type: FeedType = 'following'): Promise<Publication[]> {
  await wait(500)

  const sorted = [...resources].sort((a, b) =>
    (b.publishedAtTime || b.publishedAt).localeCompare(
      a.publishedAtTime || a.publishedAt,
    ),
  )

  let filtered: Resource[]

  switch (type) {
    case 'local':
      filtered = sorted.filter(
        resource => resource.sourcePlatform.id === user.platform.id,
      )
      break

    case 'global':
      // A API real deverá retornar somente publicações públicas.
      filtered = sorted
      break

    case 'following':
    default: {
      const ids = new Set(user.followingPlatformIds)
      filtered = sorted.filter(resource => ids.has(resource.sourcePlatform.id))
      break
    }
  }

  return filtered.map(makePublication)
}

export async function listPlatformPublications(
  id: string,
): Promise<Publication[]> {
  await wait(350)

  return resources
    .filter(resource => resource.sourcePlatform.id === id)
    .sort((a, b) =>
      (b.publishedAtTime || b.publishedAt).localeCompare(
        a.publishedAtTime || a.publishedAt,
      ),
    )
    .map(makePublication)
}

export async function publishResource(payload: {
  file: File
  title: string
  description: string
  area: string
  type: string
  license: string
  tags: string[]
}): Promise<Resource> {
  await wait(1200)

  const now = new Date()
  const resource: Resource = {
    id: `rea-${Date.now()}`,
    title: payload.title,
    description: payload.description,
    authors: [{ id: user.id, name: user.name }],
    publishedAt: now.toISOString().slice(0, 10),
    publishedAtTime: now.toISOString(),
    language: 'pt-BR',
    area: payload.area,
    type: payload.type,
    license: payload.license,
    tags: payload.tags,
    fileName: payload.file.name,
    fileSize: payload.file.size,
    sourcePlatform: platformA,
    originalUrl: 'https://rea.example.org/resources/new',
    verification: {
      overall: 'verified',
      integrity: true,
      signature: true,
      authorship: true,
      timestamp: true,
      details: [
        'Arquivo processado pela API externa.',
        'Manifesto gerado e validado.',
        'Assinatura digital válida.',
        'Evidência OpenTimestamps disponível.',
      ],
    },
    evidence: [
      { type: 'manifest', name: 'manifest.js', status: 'valid' },
      {
        type: 'signature',
        name: `${payload.file.name}.sig`,
        status: 'valid',
      },
      {
        type: 'ots',
        name: `${payload.file.name}.ots`,
        status: 'valid',
      },
    ],
    downloads: 0,
  }

  resources.unshift(resource)
  platformA.resourcesCount++

  return resource
}

export async function verifyResource(
  file: File,
  evidence: {
    manifest: File
    signature: File
    ots: File
  },
): Promise<VerificationStatus> {
  await wait(1000)

  if (!evidence.manifest || !evidence.signature || !evidence.ots) {
    throw new Error('Envie manifest.js, o arquivo .sig e a evidência .ots.')
  }

  if (file.name.toLowerCase().includes('alterado')) {
    return {
      overall: 'altered',
      integrity: false,
      signature: false,
      authorship: false,
      timestamp: false,
      details: ['O hash do arquivo não corresponde ao manifesto fornecido.'],
    }
  }

  if (evidence.signature.name.toLowerCase().includes('invalida')) {
    return {
      overall: 'invalid',
      integrity: true,
      signature: false,
      authorship: false,
      timestamp: true,
      details: ['A assinatura fornecida não pôde ser validada.'],
    }
  }

  return {
    overall: 'verified',
    integrity: true,
    signature: true,
    authorship: true,
    timestamp: true,
    details: [
      `Hash de ${file.name} compatível com ${evidence.manifest.name}.`,
      `Assinatura ${evidence.signature.name} válida.`,
      'Autoria verificável.',
      'Evidência temporal confirmada a partir do arquivo OTS.',
    ],
  }
}

export { platformA, platformB, platformC, platformD }
