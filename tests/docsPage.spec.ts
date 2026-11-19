import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import DocsPage from '@/pages/docs.vue'

function stubElectron(getDocsUrl?: () => Promise<string | undefined>) {
  vi.stubGlobal('electronAPI', getDocsUrl ? { getDocsUrl } : undefined)
  // `window.electronAPI` is what the page reads
  ;(window as any).electronAPI = getDocsUrl ? { getDocsUrl } : undefined
}

function stubFetch(response: { ok: boolean; contentType: string } | 'offline') {
  vi.stubGlobal('fetch', vi.fn(async () => {
    if (response === 'offline') throw new Error('offline')
    return { ok: response.ok, headers: { get: () => response.contentType } }
  }))
}

describe('Docs page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (window as any).electronAPI
  })

  it('embeds the handbook bundled with the app', async () => {
    stubElectron(async () => 'icodaq-docs://app/docs/')
    const wrapper = mount(DocsPage)
    await flushPromises()
    expect(wrapper.find('[data-test=docs-frame]').attributes('src')).toBe('icodaq-docs://app/docs/')
  })

  it('embeds a handbook deployed next to ICOweb, if docs.json is served', async () => {
    stubElectron(undefined)
    stubFetch({ ok: true, contentType: 'application/json' })
    const wrapper = mount(DocsPage)
    await flushPromises()
    expect(wrapper.find('[data-test=docs-frame]').attributes('src')).toMatch(/\/docs\/$/)
  })

  it('does not take the SPA fallback page for a handbook', async () => {
    stubElectron(undefined)
    stubFetch({ ok: true, contentType: 'text/html' })
    const wrapper = mount(DocsPage)
    await flushPromises()
    expect(wrapper.find('[data-test=docs-frame]').exists()).toBe(false)
    expect(wrapper.find('[data-test=docs-missing]').exists()).toBe(true)
  })

  it('explains that there is no handbook if the app was built without it', async () => {
    stubElectron(async () => undefined)
    stubFetch('offline')
    const wrapper = mount(DocsPage)
    await flushPromises()
    expect(wrapper.find('[data-test=docs-missing]').text()).toContain('Handbook not available')
  })
})
