import { ref } from 'vue'
import { load } from 'js-yaml'
import type { YamlConfig } from '@/types/metadata'

const yamlUrl = '/config/metadata.yaml'

export function useYamlConfig() {
    const config = ref<YamlConfig | null>(null)
    const error = ref<string | null>(null)

    async function reload() {
        try {
            const res = await fetch(`${yamlUrl}?t=${Date.now()}`)
            const text = await res.text()
            config.value = load(text) as YamlConfig
            error.value = null
        } catch (err) {
            error.value = (err as Error).message
            config.value = null
        }
    }

    reload()

    return {
        config,
        error,
        reload
    }
}
