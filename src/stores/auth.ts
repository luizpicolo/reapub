import { defineStore } from 'pinia'
import { finishPleromaLogin, loadPleromaConfig, verifyPleromaConnection, clearPleromaConfig } from '../api/pleroma'
import type { User } from '../types'

function userFromAccount(account: any, instanceUrl: string): User {
  const platform = {
    id: new URL(instanceUrl).host,
    name: new URL(instanceUrl).host,
    handle: `@${account.acct}`,
    url: instanceUrl,
    description: 'Instância Pleroma conectada ao REA.fed.',
    status: 'online' as const,
    followersCount: account.followers_count || 0,
    resourcesCount: 0,
    isFollowing: true,
  }
  return {
    id: account.id,
    name: account.display_name || account.username,
    email: account.acct,
    platform,
    followingPlatformIds: [platform.id],
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as User | null, loading: false }),
  getters: { isAuthenticated: state => Boolean(state.user) },
  actions: {
    setAuthenticatedAccount(account: any, instanceUrl: string) {
      this.user = userFromAccount(account, instanceUrl)
    },
    async hydrate() {
      const config = loadPleromaConfig()
      if (!config.instanceUrl || !config.accessToken) return
      try {
        const { account } = await verifyPleromaConnection(config)
        this.user = userFromAccount(account, config.instanceUrl)
      } catch {
        clearPleromaConfig()
        this.user = null
      }
    },
    async completeLogin(code: string, state: string) {
      this.loading = true
      try {
        const config = await finishPleromaLogin(code, state)
        const { account } = await verifyPleromaConnection(config)
        this.user = userFromAccount(account, config.instanceUrl)
      } finally {
        this.loading = false
      }
    },
    signOut() {
      clearPleromaConfig()
      this.user = null
    },
  },
})
