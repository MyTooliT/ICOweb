import { useSystemState } from '@/utils/useSystemState.ts';
import { defineStore } from 'pinia';
import {
    computed,
    type ComputedRef,
    type Ref,
    ref
} from 'vue';

export enum ThemeStyle {
    Light = 'light',
    Dark = 'dark',
}

export const useGeneralStore = defineStore('general', () => {
    const _activeTheme: Ref<ThemeStyle> = ref<ThemeStyle>(ThemeStyle.Light);
    const getActiveTheme: ComputedRef<ThemeStyle> = computed(() => _activeTheme.value)
    function setActiveTheme(newTheme: ThemeStyle): Boolean {
        if(newTheme !== _activeTheme.value) {
            _activeTheme.value = newTheme    
            return true        
        }
        return false
    }

    const systemState = useSystemState((event: any) => {
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
    })

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