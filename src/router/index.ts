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
  }
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
  // Do not wait for the response: navigation must not depend on how fast the
  // API answers. The state is updated as soon as the response arrives and is
  // kept current by the WebSocket in the meantime.
  void store.systemState.checkState()
  store.setLoaderInfoMessage('Checking system state...')

  // The CAN state may not be known yet right after loading the page. Ask once
  // before talking to the CAN network, so that no request fails with 503.
  async function canConnected(): Promise<boolean> {
    if(store.systemState.canStatus !== 'CONNECTED') {
      await store.systemState.checkState()
    }
    return store.systemState.canStatus === 'CONNECTED'
  }

  // With several units the CAN state describes the first unit only
  async function unitsConnected(): Promise<boolean> {
    if(!store.systemState.units) await store.systemState.checkState()
    return (store.systemState.units ?? []).length > 0
  }

  if(_to.name === 'Home' && store.systemState.multiUnit) {
    const hwStore = useHardwareStore()
    if(await unitsConnected()) {
      store.setLoaderInfoMessage('Checking units...')
      try {
        await hwStore.refetchSensorsAndHolders()
      } catch(e) {
        console.log(e)
      }
      for(const unit of store.systemState.units ?? []) {
        if(!unit.stu_connected) continue
        // The STU and sensor devices of a unit are only loaded if they are
        // not known yet (loading them is slow, the user can reload them)
        if(hwStore.stuListFor(unit.unit).length === 0) {
          try {
            await hwStore.loadUnit(unit.unit)
          } catch(e) {
            console.log(e)
          }
        }
      }
      hwStore.applyConnectedSTHs(store.systemState.units ?? [])
    }
  } else if(_to.name === 'Home') {
    const hwStore = useHardwareStore()
    if(!await canConnected()) {
      hwStore.clearSTHDeviceList()
    } else if(hwStore.activeSTU) {
      store.setLoaderInfoMessage('Checking for active measurement...')
      if(!await hwStore.checkSTUConnection()) {
        store.setLoaderInfoMessage('Checking STU...')
        try {
          await hwStore.updateSTUDeviceList()
        } catch(e) {
          store.setGlobalLoader(false)
          store.setLoaderInfoMessage('')
        }
        store.setLoaderInfoMessage('Checking Holder Configs...')
        try {
          await hwStore.refetchSensorsAndHolders()
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
      hwStore.applyConnectedSTH(store.systemState.sthConnected)
    } else {
        hwStore.clearSTHDeviceList()
    }
  }

  if(_to.name === 'Measure' && store.systemState.multiUnit) {
    if(await unitsConnected()) {
      const hwStore = useHardwareStore()
      hwStore.applyConnectedSTHs(store.systemState.units ?? [])
      // Reading from the sensor devices is only possible without measurement
      if(!store.systemState.running) {
        for(const sth of hwStore.activeSTHs) {
          try {
            store.setLoaderInfoMessage('Checking Supply Voltage...')
            await sth.requestSupplyVoltage()
          } catch (e) {
            console.log(e)
          }
        }
        if(hwStore.activeSTH) {
          try {
            store.setLoaderInfoMessage('Checking ADC settings...')
            await useADCStore().fetchADCValues()
          } catch (e) { console.log(e) }
        }
      }
    }
  } else if(_to.name === 'Measure') {
    if(await canConnected()) {
      const hwStore = useHardwareStore()
      store.setLoaderInfoMessage('Checking for active measurement...')
      // Reload-safe: take the connected sensor device from the API instead of
      // trusting (or probing and then overwriting) what local storage says.
      // This is also needed while a measurement is running, e.g. one that
      // another client started.
      hwStore.applyConnectedSTH(store.systemState.sthConnected)

      // Reading from the sensor device is only possible without measurement
      if(hwStore.activeSTH && !store.systemState.running) {
        const adcStore = useADCStore()
        try {
          store.setLoaderInfoMessage('Checking ADC settings...')
          await adcStore.fetchADCValues()
        } catch (e) { console.log(e) }
        try {
          store.setLoaderInfoMessage('Checking Supply Voltage...')
          await hwStore.activeSTH.requestSupplyVoltage()
        } catch (e) {
          console.log(e)
        }
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

