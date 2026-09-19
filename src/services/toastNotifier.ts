export type ToastType = 'success' | 'error' | 'info';

type ToastListener = (type: ToastType, title: string, message?: string) => void;

class ToastNotifier {
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(type: ToastType, title: string, message?: string) {
    this.listeners.forEach((listener) => {
      try {
        listener(type, title, message);
      } catch (err) {
        console.error('[ToastNotifier] Listener error:', err);
      }
    });
  }
}

export const toastNotifier = new ToastNotifier();
