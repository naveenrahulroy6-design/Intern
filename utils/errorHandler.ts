
import { ToastType } from '../hooks/useToast.tsx';

type ToastFn = (toast: { type: ToastType; message: string }) => void;

/**
 * Parses an API error object and returns a user-friendly message.
 * @param error The error object, likely from an API client like Axios.
 * @param fallbackMessage An optional fallback message.
 * @returns A string containing the error message.
 */
export const getApiErrorMessage = (error: any, fallbackMessage?: string): string => {
    const fallback = fallbackMessage || 'An unexpected error occurred. Please try again.';

    if (error?.response?.data?.message) {
        return error.response.data.message;
    }
    if (error?.response) {
        const status = error.response.status;
        if (status >= 500) {
            return `A server error occurred (Code: ${status}). Please try again later.`;
        }
        if (status === 401 || status === 403) {
             return `Authentication error (Code: ${status}). Please try logging in again.`;
        }
        if (status >= 400) {
            return `There was a problem with your request (Code: ${status}). Please check your input.`;
        }
    }
    if (error?.request) {
        return 'Network error. Please check your internet connection and try again.';
    }
    if (error?.message) {
        return error.message;
    }
    return fallback;
}

/**
 * Handles an API error by logging it and showing a toast notification.
 * @param error The error object.
 * @param addToast The toast function from useToast.
 * @param options Optional context for logging and a fallback message.
 */
export const handleApiError = (
    error: any,
    addToast: ToastFn,
    options?: { context?: string; fallbackMessage?: string }
) => {
    const message = getApiErrorMessage(error, options?.fallbackMessage);
    console.error(options?.context ? `API Error in ${options.context}:` : 'API Error:', error);
    addToast({ type: 'error', message });
};
