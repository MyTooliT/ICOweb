// Import top-level views
import Analyze from '@/pages/analyze.vue';
import Config from '@/pages/config.vue';
import Sensors from '@/pages/config/sensors.vue';
import Tools from '@/pages/config/tools.vue';
import Debug from '@/pages/debug.vue';
import Files from '@/pages/files.vue';
import Help from '@/pages/help.vue';
import Home from '@/pages/index.vue';
import Measure from '@/pages/measure.vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
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
];


const router = createRouter({
  history: createWebHashHistory(),
  routes
})


router.beforeEach(async (_to, _from, next) => {
  const store = useGeneralStore()
  store.setGlobalLoader(true)

  next()
})

router.afterEach(async (_to, _from, _failure) => {
  const store = useGeneralStore()
  await store.apiState.checkState()

  if(!store.apiState.reachable) {
    store.setGlobalLoader(false)
    return
  }

  if(_to.name === 'Home') {
    const hwStore = useHardwareStore()
    if(hwStore.activeSTU) {
      if(!await hwStore.checkSTUConnection()) {
        await hwStore.updateSTUDeviceList()
        await hwStore.updateSTHDeviceList()
      }
    } else {
        hwStore.clearSTHDeviceList()
    }
  }

  if(_to.name === 'Measure') {
    const mStore = useMeasurementStore()
    await mStore.checkMeasurementStatus()
    if(!mStore.measurementStatus.running) {
      const hwStore = useHardwareStore()
      await hwStore.checkSTUConnection()
    }
  }

  if(_to.name === 'Files') {
    const mStore = useMeasurementStore()
    await mStore.getFiles()
  }

  store.setGlobalLoader(false)
})

export default router

