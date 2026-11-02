import { create } from 'zustand'

export type ToastTone = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastState {
  toasts: Toast[]
  nextId: number
  show: (message: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  nextId: 1,
  show: (message, tone = 'success') =>
    set(({ toasts, nextId }) => ({
      toasts: [...toasts, { id: nextId, message, tone }],
      nextId: nextId + 1,
    })),
  dismiss: (id) => set(({ toasts }) => ({ toasts: toasts.filter((toast) => toast.id !== id) })),
}))

/** Shows a toast from anywhere, including outside React (e.g. mutation callbacks). */
export const showToast = (message: string, tone?: ToastTone) =>
  useToastStore.getState().show(message, tone)
