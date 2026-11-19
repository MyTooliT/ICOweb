import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

const systemState = reactive({ reachable: true, multiUnit: true, checkState: vi.fn(async () => {}) })
vi.mock('@/stores/generalStore/generalStore.ts', () => ({ useGeneralStore: () => ({ systemState }) }))

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
    vi.restoreAllMocks()
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

  describe('flavour of the handbook (one STU / several STUs)', () => {
    // happy-dom does not load iframe pages: give the iframe a window that records messages
    async function mountWithFrame() {
      const post = vi.fn()
      vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue({ postMessage: post } as any)
      stubElectron(async () => 'icodaq-docs://app/docs/')
      const wrapper = mount(DocsPage, { attachTo: document.body })
      await flushPromises()
      return { wrapper, post }
    }

    it('asks the backend state before showing the handbook', async () => {
      systemState.checkState.mockClear()
      stubElectron(async () => 'icodaq-docs://app/docs/')
      mount(DocsPage)
      await flushPromises()
      expect(systemState.checkState).toHaveBeenCalled()
    })

    it('tells the handbook that several STUs are supported, and when that changes', async () => {
      systemState.reachable = true
      systemState.multiUnit = true
      const { wrapper, post } = await mountWithFrame()
      await wrapper.find('iframe').trigger('load')
      expect(post).toHaveBeenLastCalledWith({ type: 'icodaq-docs-variant', multiStu: true }, '*')

      systemState.multiUnit = false
      await flushPromises()
      expect(post).toHaveBeenLastCalledWith({ type: 'icodaq-docs-variant', multiStu: false }, '*')
      wrapper.unmount()
    })

    it('stays silent while the API is not reachable', async () => {
      systemState.reachable = false
      const { wrapper, post } = await mountWithFrame()
      await wrapper.find('iframe').trigger('load')
      expect(post).not.toHaveBeenCalled()
      systemState.reachable = true
      wrapper.unmount()
    })
  })
})
