import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../views/HomeView.vue') },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/register', component: () => import('../views/RegisterView.vue') },
    { path: '/oauth/callback', component: () => import('../views/OAuthCallbackView.vue') },
    { path: '/feed', component: () => import('../views/FeedView.vue'), meta: { auth: true } },
    { path: '/users', component: () => import('../views/UsersView.vue'), meta: { auth: true } },
    { path: '/feed/local', redirect: '/feed?feed=local', meta: { auth: true } },
    { path: '/feed/following', redirect: '/feed?feed=following', meta: { auth: true } },
    { path: '/feed/global', redirect: '/feed?feed=global', meta: { auth: true } },
    { path: '/resources', component: () => import('../views/ResourcesView.vue') },
    { path: '/resources/new', component: () => import('../views/PublishView.vue'), meta: { auth: true } },
    { path: '/resources/:id/edit', component: () => import('../views/EditResourceView.vue'), meta: { auth: true } },
    { path: '/resources/:id', component: () => import('../views/ResourceView.vue') },
    { path: '/verify', component: () => import('../views/VerifyView.vue') },
    { path: '/dashboard', component: () => import('../views/DashboardView.vue'), meta: { auth: true } },
    { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { auth: true } },
    { path: '/federation', component: () => import('../views/FederationView.vue') },
    { path: '/federation/following', component: () => import('../views/FollowingView.vue'), meta: { auth: true } },
    { path: '/federation/:id', component: () => import('../views/PlatformView.vue') },
  ],
})

router.beforeEach(async to => {
  const auth = useAuthStore()
  if (!auth.user) await auth.hydrate()
  if (to.meta.auth && !auth.isAuthenticated) return '/login'
})

export default router
