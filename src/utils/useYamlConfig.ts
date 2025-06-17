import { ref } from 'vue'
import { load } from 'js-yaml'
import type { MetadataConfig } from '@/types/metadata'

const yamlUrl = './config/metadata.yaml'

export function useYamlConfig() {
    const config = ref<MetadataConfig | null>(null)
    const error = ref<string | null>(null)

    async function reload() {
        try {
            const res = await fetch(`${yamlUrl}?t=${Date.now()}`)
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
