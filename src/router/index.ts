// Import top-level views
import Analyze from '@/pages/analyze.vue';
import Config from '@/pages/config.vue';
import Files from '@/pages/files.vue';
import Help from '@/pages/help.vue';
import Home from '@/pages/index.vue';
import Measure from '@/pages/measure.vue';
import Logs from '@/pages/logs.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
import {
  createRouter,
  createWebHashHistory
} from 'vue-router';
import {useADCStore} from '@/stores/ADCStore/ADCStore.ts';

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
  },
  {
    path: '/files',
    name: 'Files',
    component: Files,
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
  {
    path: '/logs',
    name: 'Logs',
    component: Logs,
  },
];


const router = createRouter({
  history: createWebHashHistory(),
  routes
})


router.beforeEach(async (_to, _from, next) => {
  const store = useGeneralStore()
  store.resetLoaderInfoMessage()
  store.setGlobalLoader(true)

  next()
})

router.afterEach(async (_to, _from, _failure) => {
  const store = useGeneralStore()
  store.setLoaderInfoMessage('Checking system state...')
  if(!store.systemState.hasWS) {
    store.setLoaderInfoMessage('Connecting to system...')
    store.systemState.connectWebSocket()
  }
  await store.systemState.checkState()
  store.setLoaderInfoMessage('Checking system state...')

  if(_to.name === 'Home') {
    const hwStore = useHardwareStore()
    if(hwStore.activeSTU) {
      store.setLoaderInfoMessage('Checking for active measurement...')
      if(!await hwStore.checkSTUConnection()) {
        store.setLoaderInfoMessage('Checking STU...')
        try {
          await hwStore.updateSTUDeviceList()
        } catch(e) {
          store.setGlobalLoader(false)
          store.setLoaderInfoMessage('')
        }
        store.setLoaderInfoMessage('Checking STH devices...')
        try {
          await hwStore.updateSTHDeviceList()
        } catch(e) {
          store.setGlobalLoader(false)
          store.setLoaderInfoMessage('')
        }
      }
    } else {
        hwStore.clearSTHDeviceList()
    }
  }

  if(_to.name === 'Measure') {
    if(!store.systemState.running) {
      const hwStore = useHardwareStore()
      store.setLoaderInfoMessage('Checking for active measurement...')
      await hwStore.checkSTUConnection()

      if(hwStore.activeSTH) {
        const adcStore = useADCStore()
        try {
          store.setLoaderInfoMessage('Checking ADC settings...')
          await adcStore.fetchADCValues()
        } catch (e) { console.log(e) }
      }
    }
  }

  if(_to.name === 'Files') {
    const mStore = useMeasurementStore()
    store.setLoaderInfoMessage('Checking files...')
    await mStore.getFiles()
  }

  store.setGlobalLoader(false)
})

export default router

