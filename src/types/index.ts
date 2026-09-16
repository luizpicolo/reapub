export type FeedType = 'local' | 'following' | 'global'

export interface Author {
  id: string
  name: string
  email?: string
  platform?: FederationPlatform
}

export interface FederationPlatform {
  id: string
  name: string
  handle: string
  url: string
  logo?: string
  description: string
  status: 'online' | 'offline'
  followersCount: number
  resourcesCount: number
  isFollowing: boolean
}

export interface Evidence {
  type: 'manifest' | 'signature' | 'ots' | 'hash'
  name: string
  status: 'valid' | 'invalid' | 'pending'
  value?: string
  downloadUrl?: string
}

export interface VerificationStatus {
  overall: 'verified' | 'altered' | 'invalid' | 'incomplete' | 'pending'
  integrity: boolean
  signature: boolean
  authorship: boolean
  timestamp: boolean
  details: string[]
}

export interface Resource {
  id: string
  title: string
  description: string
  authors: Author[]
  publishedAt: string
  publishedAtTime?: string
  language: string
  area: string
  type: string
  license: string
  tags: string[]
  fileName: string
  fileSize: number
  sourcePlatform: FederationPlatform
  originalUrl: string
  verification: VerificationStatus
  evidence: Evidence[]
  downloads: number
}

export interface Publication {
  id: string
  resource: Resource
  publishedAt: string
  sourcePlatform: FederationPlatform
  actorName: string
  summary: string
}

export interface Follow {
  id: string
  followerId: string
  followingPlatformId: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  platform: FederationPlatform
  followingPlatformIds: string[]
}
