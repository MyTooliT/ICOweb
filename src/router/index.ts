// Import top-level views
import Analyze from '@/pages/analyze.vue';
import Config from '@/pages/config.vue';

// Import config child views
import Sensors from '@/pages/config/sensors.vue';
import Storage from '@/pages/config/storage.vue';
import Tools from '@/pages/config/tools.vue';
import Debug from '@/pages/debug.vue';
import Help from '@/pages/help.vue';
import Home from '@/pages/index.vue';
import Measure from '@/pages/measure.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import {
  createRouter,
  createWebHashHistory
} from 'vue-router';

// Define the routes
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/analyze',
    name: 'Analyze',
    component: Analyze,
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
    children: [
      {
        path: 'sensors',
        name: 'Sensors',
        component: Sensors,
      },
      {
        path: 'storage',
        name: 'Storage',
        component: Storage,
      },
      {
        path: 'tools',
        name: 'Tools',
        component: Tools,
      },
    ],
  },
  {
    path: '/debug',
    name: 'Debug',
    component: Debug,
  },
  {
    path: '/help',
    name: 'Help',
    component: Help,
  },
  {
    path: '/measure',
    name: 'Measure',
    component: Measure,
  },
];


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

