export type LwpToast = {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: ToastPosition;
}

export enum ToastType {
    SUCCESS = 'success',
    ERROR = 'error',
    INFO = 'info',
}

export type ToastPosition = "none" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | undefined;