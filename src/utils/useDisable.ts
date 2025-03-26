export function useDisable() {
    const disabled_pages_env = import.meta.env.VITE_APPLICATION_DISABLE_PAGES
    const disabled_pages = disabled_pages_env
        ? disabled_pages_env.split(',')
        : undefined
    const enabled_features_env = import.meta.env.VITE_APPLICATION_ENABLE_FEATURES
    const enabled_features = enabled_features_env
        ? enabled_features_env.split(',')
        : undefined

    function pageEnabled(routeName: string): boolean {
        if (!disabled_pages) return true
        return !disabled_pages.includes(routeName)
    }

    function pageDisabled(routeName: string): boolean {
        if (!disabled_pages) return false
        return disabled_pages.includes(routeName)
    }

    function featureEnabled(featureName: string): boolean {
        if (!enabled_features) return false
        return enabled_features.includes(featureName)
    }

    return {
        disabled_pages,
        pageEnabled,
        pageDisabled,
        featureEnabled
    }
}