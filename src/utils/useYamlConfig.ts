import { ref } from 'vue'
import { load } from 'js-yaml'
import type { MetadataConfig } from '@/utils/metadataConfig.ts'
import {getAPILink} from '@/api/icoapi.ts';

const yamlUrl = getAPILink() + '/config/meta'

export function useYamlConfig() {
    const config = ref<MetadataConfig | null>(null)
    const error = ref<string | null>(null)

    async function reload(url: string = yamlUrl) {
        try {
            const res = await fetch(`${url}?t=${Date.now()}`)
            const text = await res.text()
            config.value = load(text) as MetadataConfig
            error.value = null
        } catch (err) {
            error.value = (err as Error).message
            config.value = null
        }
    }

    async function isEnabled(): Promise<boolean> {
        await reload()
        return (config.value !== null
            && error.value === null
            && config.value.info.version !== ''
            && config.value.info.version !== undefined
            && config.value.info.version !== null)

    }

    return {
        config,
        error,
        reload,
        isEnabled,
    }
}
