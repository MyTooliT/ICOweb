import { useSystemState } from '@/utils/useSystemState.ts';
import { defineStore } from 'pinia';
import {
    computed,
    type ComputedRef,
    type Ref,
    ref
} from 'vue';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';

export enum ThemeStyle {
    Light = 'light',
    LightMediumContrast = 'light-medium-contrast',
    LightHighContrast = 'light-hight-contrast',
    Dark = 'dark',
    DarkMediumContrast = 'dark-medium-contrast',
    DarkHighContrast = 'dark-high-contrast',
}


export const useGeneralStore = defineStore('general', () => {
    const hwStore = useHardwareStore()
    const _activeTheme: Ref<ThemeStyle> = ref<ThemeStyle>(ThemeStyle.Light);
    /* eslint-disable-next-line max-len */
    const getActiveTheme: ComputedRef<ThemeStyle> = computed(() => _activeTheme.value)
    function setActiveTheme(newTheme: ThemeStyle): Boolean {
        if(newTheme !== _activeTheme.value) {
            _activeTheme.value = newTheme    
            return true        
        }
        return false
    }

    const systemState = useSystemState(
    (event: any) => {
        switch(event.message) {
            case 'post_meta_request':
                postMetaModalVisible.value = true
                break;
            case 'post_meta_completed':
                postMetaModalVisible.value = false
                break;
            default:
                console.error(`Unknown event: ${event.data}`)
                break;
        }
    },
        (event) => {
            if(event.state !== 'SENSOR_NODE_CONNECTED' && hwStore.activeSTH) {
                hwStore.deselectSTHDevices()
            }
        }
    )

    /*
    ******************************************************
    *                  LoaderState                       *
    ******************************************************
    */

    const loaderDelay = ref<number>(0)
    const navigationLoader = ref<boolean>(true)
    const globalLoader = ref<boolean>(false)
    function setGlobalLoader(state: boolean): void {
        if(window) {
            window.setTimeout(() => {
                globalLoader.value = state
            }, loaderDelay.value)
        } else {
            globalLoader.value = state
        }
    }
    const loaderInfoMessage = ref<string>('')
    function setLoaderInfoMessage(message: string): void {
        loaderInfoMessage.value = message
    }
    const getLoaderInfoMessage = computed<string>(() => {
        return loaderInfoMessage.value
    })
    function resetLoaderInfoMessage(): void {
        loaderInfoMessage.value = ''
    }

    /*
    ******************************************************
    *                  Tabs State                        *
    ******************************************************
    */

    const tabIndex = ref<string>('0')


    /*
    ******************************************************
    *                  Modal State                       *
    ******************************************************
    */

    const newRangeModalVisible = ref<boolean>(false)
    const newTypeModalVisible = ref<boolean>(false)
    const addHolderModalVisible = ref<boolean>(false)
    const fileSelectionModalVisible = ref<boolean>(false)
    const renameSTHModalVisible = ref<boolean>(false)
    const postMetaModalVisible = ref<boolean>(false)

    /*
    ******************************************************
    *                  Query State                       *
    ******************************************************
    */

    const lastFileQuery = ref<string | null>(null)
    const fileQuery = computed<string>(() => {
        if (!lastFileQuery.value) return ''
        return `?file=${encodeURIComponent(lastFileQuery.value)}`
    })

    return {
        getActiveTheme,
        setActiveTheme,
        tabIndex,
        newRangeModalVisible,
        newTypeModalVisible,
        addHolderModalVisible,
        fileSelectionModalVisible,
        renameSTHModalVisible,
        globalLoader,
        setGlobalLoader,
        navigationLoader,
        lastFileQuery,
        fileQuery,
        systemState,
        setLoaderInfoMessage,
        resetLoaderInfoMessage,
        getLoaderInfoMessage,
        postMetaModalVisible
    }
}, {
    persist: true
})