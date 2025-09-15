import { ref } from 'vue'
import { load } from 'js-yaml'
import type { MetadataConfig } from '@/utils/metadataConfig.ts'

const yamlUrl = './config/metadata.yaml'

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

    return {
        config,
        error,
        reload
    }
}
