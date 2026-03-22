import {useToast} from 'primevue/usetoast';

const DEFAULT_TIMEOUT = 3000

type MessageTimeoutOptions = {
    success?: number,
    error?: number,
    info?: number,
}

export const useMessageBus = (
    timeouts: MessageTimeoutOptions = {}
) => {
    const toast = useToast()

    const overwritten_timeouts = {
        success: timeouts.success || DEFAULT_TIMEOUT,
        error: timeouts.error || DEFAULT_TIMEOUT,
        info: timeouts.info || DEFAULT_TIMEOUT,
    }

    const success = (
        title: string,
        message: string | undefined = undefined,
        timeout: number = overwritten_timeouts.success,
        group: string = 'default'
    ) => toast.add({
        severity: 'success',
        summary: title,
        detail: message,
        life: timeout,
        group: group
    })

    const error = (
        title: string,
        message: string | undefined = undefined,
        timeout: number = overwritten_timeouts.error,
        group: string = 'default'
    ) => toast.add({
        severity: 'error',
        summary: title,
        detail: message,
        life: timeout,
        group: group
    })

    const info = (
        title: string,
        message: string | undefined = undefined,
        timeout: number = overwritten_timeouts.info,
        group: string = 'default'
    ) => toast.add({
        severity: 'info',
        summary: title,
        detail: message,
        life: timeout,
        group: group
    })

    return {
        success,
        error,
        info
    }
}