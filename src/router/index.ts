import {
  createRouter,
  createWebHashHistory
} from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

const router = createRouter({
  history: createWebHashHistory(),
  routes
})


router.beforeEach((_to, _from, next) => {
  const store = useGeneralStore()
  if(store.navigationLoader) {
    store.setGlobalLoader(true)
  }
  next()
})

router.afterEach(() => {
  const store = useGeneralStore()
  store.setGlobalLoader(false)
})

export default router

