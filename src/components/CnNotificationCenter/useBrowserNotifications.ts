import { useCallback, useState } from "react";

export type CnBrowserNotificationPermission = NotificationPermission | "unsupported";

export type CnBrowserNotificationsApi = {
  /** El navegador expone la API `Notification`. */
  supported: boolean;
  permission: CnBrowserNotificationPermission;
  /** Pide permiso (debe llamarse desde un gesto del usuario, p. ej. un clic). */
  requestPermission: () => Promise<CnBrowserNotificationPermission>;
  /** Muestra una notificación del sistema si hay permiso; devuelve `null` si no. */
  notify: (
    title: string,
    options?: NotificationOptions & { onClick?: () => void },
  ) => Notification | null;
};

const getApi = (): typeof Notification | null =>
  typeof window !== "undefined" && "Notification" in window ? window.Notification : null;

/**
 * Ayuda para notificaciones del navegador: soporte, permiso y envío. No pide
 * permiso por su cuenta; hazlo desde un botón ("Activar avisos del escritorio").
 */
export const useBrowserNotifications = (): CnBrowserNotificationsApi => {
  const api = getApi();
  const [permission, setPermission] = useState<CnBrowserNotificationPermission>(
    api ? api.permission : "unsupported",
  );

  const requestPermission = useCallback(async () => {
    const N = getApi();
    if (!N) return "unsupported" as const;
    try {
      const result = await N.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return N.permission;
    }
  }, []);

  const notify = useCallback<CnBrowserNotificationsApi["notify"]>((title, options = {}) => {
    const N = getApi();
    if (!N || N.permission !== "granted") return null;
    const { onClick, ...rest } = options;
    try {
      const notification = new N(title, rest);
      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
      return notification;
    } catch {
      return null;
    }
  }, []);

  return { supported: Boolean(api), permission, requestPermission, notify };
};
