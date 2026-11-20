import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnNotificationCenter } from "./CnNotificationCenter";
import type { CnNotification, CnNotificationCenterProps } from "./CnNotificationCenter.types";
import { CnNotificationCenterSkeleton } from "./CnNotificationCenterSkeleton";
import {
  CN_NOTIFICATION_SNOOZE_OPTIONS,
  formatHotkey,
  isSnoozed,
  matchesHotkey,
  notificationSourceKey,
} from "./notification-utils";
import { useBrowserNotifications } from "./useBrowserNotifications";

const now = Date.now();
const DATA: CnNotification[] = [
  {
    id: "1",
    title: "Factura A-1024 timbrada",
    message: "Se envió al cliente.",
    time: now - 60000,
    tone: "success",
    icon: "receipt",
  },
  {
    id: "2",
    title: "Ana te mencionó",
    message: "@tú revisa el contrato",
    time: now - 3600000,
    mention: true,
  },
  {
    id: "3",
    title: "Respaldo completado",
    time: now - 2 * 86400000,
    read: true,
    source: "Sistema",
  },
];

describe("CnNotificationCenter", () => {
  it("shows the unread count on an accessible bell button", () => {
    render(<CnNotificationCenter notifications={DATA} />);
    const bell = screen.getByRole("button", { name: "Notificaciones, 2 sin leer" });
    expect(bell).toHaveAttribute("aria-haspopup", "dialog");
    expect(bell).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("opens a dialog panel grouped by day with tabs", () => {
    render(<CnNotificationCenter notifications={DATA} panel="popover" />);
    fireEvent.click(screen.getByRole("button", { name: /Notificaciones/ }));
    const panel = screen.getByRole("dialog", { name: "Notificaciones" });
    expect(within(panel).getByText("2 sin leer")).toBeInTheDocument();
    expect(within(panel).getByText("Hoy")).toBeInTheDocument();
    expect(within(panel).getByRole("tab", { name: /Todas/ })).toBeInTheDocument();
    expect(within(panel).getByText("Respaldo completado")).toBeInTheDocument();
  });

  it("filters by tab (unread and mentions) with tab empty states", () => {
    render(<CnNotificationCenter notifications={DATA} defaultOpen panel="popover" />);
    fireEvent.click(screen.getByRole("tab", { name: /Menciones/ }));
    expect(screen.getByText("Ana te mencionó")).toBeInTheDocument();
    expect(screen.queryByText("Factura A-1024 timbrada")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /No leídas/ }));
    expect(screen.queryByText("Respaldo completado")).not.toBeInTheDocument();
  });

  it("marks as read on click, toggles read and marks all", () => {
    const onMarkRead = vi.fn();
    const onMarkAllRead = vi.fn();
    const onNotificationClick = vi.fn();
    render(
      <CnNotificationCenter
        notifications={DATA}
        defaultOpen
        panel="popover"
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
        onNotificationClick={onNotificationClick}
      />,
    );
    fireEvent.click(screen.getByText("Factura A-1024 timbrada"));
    expect(onMarkRead).toHaveBeenCalledWith(["1"], true);
    expect(onNotificationClick).toHaveBeenCalledWith(DATA[0]);
  });

  it("offers per-item read toggle, custom actions and dismiss", () => {
    const onMarkRead = vi.fn();
    const onDismiss = vi.fn();
    const onArchive = vi.fn();
    render(
      <CnNotificationCenter
        mode="inline"
        notifications={[
          { ...DATA[2], actions: [{ id: "archive", label: "Archivar", onClick: onArchive }] },
        ]}
        onMarkRead={onMarkRead}
        onDismiss={onDismiss}
        onMarkAllRead={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Marcar como no leída/ }));
    expect(onMarkRead).toHaveBeenCalledWith(["3"], false);
    fireEvent.click(screen.getByRole("button", { name: /Más acciones/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archivar" }));
    expect(onArchive).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Más acciones/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Descartar" }));
    expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ id: "3" }));
    expect(screen.getByRole("button", { name: "Marcar todas como leídas" })).toBeDisabled();
  });

  it("shows the empty state", () => {
    render(<CnNotificationCenter mode="inline" notifications={[]} />);
    expect(screen.getByText("Sin notificaciones")).toBeInTheDocument();
    expect(screen.getByText("Todo al día")).toBeInTheDocument();
  });

  it("detects new notifications pushed in real time and announces them", () => {
    const onNew = vi.fn();
    const Live = () => {
      const [items, setItems] = useState(DATA);
      return (
        <>
          <button
            onClick={() =>
              setItems((prev) => [{ id: "new", title: "Nuevo pedido", time: Date.now() }, ...prev])
            }
          >
            push
          </button>
          <button
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { id: "old", title: "Antigua", time: now - 9 * 86400000 },
              ])
            }
          >
            older
          </button>
          <CnNotificationCenter notifications={items} onNewNotifications={onNew} preview />
        </>
      );
    };
    render(<Live />);
    fireEvent.click(screen.getByText("older"));
    expect(onNew).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("push"));
    expect(onNew).toHaveBeenCalledWith([expect.objectContaining({ id: "new" })]);
    expect(document.querySelector("[data-cn-notification-live]")).toHaveTextContent(
      "Nueva notificación: Nuevo pedido",
    );
    expect(screen.getByRole("region", { name: "Notificaciones nuevas" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar vista previa" }));
    expect(screen.queryByRole("region", { name: "Notificaciones nuevas" })).not.toBeInTheDocument();
  });

  it("calls onLoadMore through the list when there are more", async () => {
    const onLoadMore = vi.fn();
    render(
      <CnNotificationCenter mode="inline" notifications={DATA} hasMore onLoadMore={onLoadMore} />,
    );
    // La lista tiene alto máximo: al desplazar cerca del final pide más.
    const panel = screen.getByRole("region", { name: "Notificaciones" });
    panel.querySelectorAll("*").forEach((el) => fireEvent.scroll(el));
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
  });

  it("renders view-all and settings links", () => {
    const onViewAll = vi.fn();
    render(
      <CnNotificationCenter
        notifications={DATA}
        defaultOpen
        panel="popover"
        onViewAll={onViewAll}
        settingsHref="/ajustes/notificaciones"
      />,
    );
    expect(screen.getByRole("link", { name: "Configurar notificaciones" })).toHaveAttribute(
      "href",
      "/ajustes/notificaciones",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver todas" }));
    expect(onViewAll).toHaveBeenCalled();
  });

  it("uses a drawer panel when requested", () => {
    render(<CnNotificationCenter notifications={DATA} panel="drawer" defaultOpen />);
    expect(screen.getByRole("dialog", { name: "Notificaciones" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
  });

  it("renders skeletons", () => {
    const { rerender } = render(<CnNotificationCenter notifications={DATA} skeleton />);
    expect(screen.getByRole("status", { name: "Cargando notificaciones" })).toBeInTheDocument();
    rerender(<CnNotificationCenter mode="inline" notifications={DATA} skeleton />);
    expect(screen.getByRole("status", { name: "Cargando notificaciones" })).toBeInTheDocument();
    rerender(<CnNotificationCenterSkeleton mode="inline" rows={2} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("caps the badge label for large counts", () => {
    render(<CnNotificationCenter notifications={[]} unreadCount={250} />);
    expect(
      screen.getByRole("button", { name: "Notificaciones, más de 99 sin leer" }),
    ).toBeInTheDocument();
  });
});

describe("CnNotificationCenter · organización", () => {
  const MIXED: CnNotification[] = [
    { id: "n1", title: "Factura", time: now - 60000, source: "Facturación" },
    {
      id: "u1",
      title: "Servidor caído",
      time: now - 7200000,
      priority: "urgent",
      source: "Sistema",
    },
    { id: "o1", title: "Respaldo", time: now - 3 * 3600000, read: true, source: "Sistema" },
  ];

  it("pins unread urgent ones on top and separates new arrivals", () => {
    render(<CnNotificationCenter mode="inline" notifications={MIXED} lastSeenAt={now - 600000} />);
    const headers = Array.from(document.querySelectorAll("[data-cn-list-subheader-title]")).map(
      (h) => h.textContent,
    );
    expect(headers.slice(0, 2)).toEqual(["Urgentes", "Nuevas"]);
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("groups by source and by category", () => {
    const { rerender } = render(
      <CnNotificationCenter
        mode="inline"
        notifications={MIXED}
        groupBy="source"
        pinUrgent={false}
      />,
    );
    expect(screen.getByText("Facturación", { selector: "[data-cn-list-subheader-title]" }));
    expect(screen.getByText("Sistema", { selector: "[data-cn-list-subheader-title]" }));
    rerender(
      <CnNotificationCenter
        mode="inline"
        notifications={[{ id: "c", title: "Sin categoría", category: undefined }]}
        groupBy="category"
      />,
    );
    expect(
      screen.getByText("Sin categoría", { selector: "[data-cn-list-subheader-title]" }),
    ).toBeInTheDocument();
  });

  it("hides snoozed ones (also from the counter) and offers snooze and mute actions", () => {
    const onSnooze = vi.fn();
    const onMuteSource = vi.fn();
    render(
      <CnNotificationCenter
        mode="inline"
        notifications={[
          ...MIXED,
          { id: "z", title: "Pospuesta", snoozedUntil: now + 3600000, source: "Sistema" },
        ]}
        onSnooze={onSnooze}
        onMuteSource={onMuteSource}
        mutedSources={["Sistema"]}
      />,
    );
    expect(screen.queryByText("Pospuesta")).not.toBeInTheDocument();
    expect(screen.getByText("2 sin leer")).toBeInTheDocument();
    const row = screen.getByText("Factura").closest("[data-cn-list-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /Más acciones/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Posponer 1 hora" }));
    expect(onSnooze).toHaveBeenCalledWith(expect.objectContaining({ id: "n1" }), expect.any(Date));
    expect(onSnooze.mock.calls[0][1].getTime()).toBeGreaterThan(Date.now() + 3500000);
    fireEvent.click(within(row).getByRole("button", { name: /Más acciones/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Silenciar «Facturación»" }));
    expect(onMuteSource).toHaveBeenCalledWith("Facturación", true);
    expect(screen.getAllByText("Origen silenciado").length).toBeGreaterThan(0);
  });

  it("searches inside the panel with an empty state", () => {
    render(<CnNotificationCenter mode="inline" notifications={MIXED} searchable />);
    const box = screen.getByRole("searchbox", { name: "Buscar notificaciones" });
    fireEvent.change(box, { target: { value: "servidor" } });
    expect(screen.getByText("Servidor caído")).toBeInTheDocument();
    expect(screen.queryByText("Factura")).not.toBeInTheDocument();
    fireEvent.change(box, { target: { value: "nada que coincida" } });
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("selects several and runs bulk actions", () => {
    const onMarkRead = vi.fn();
    const onDismissMany = vi.fn();
    const onNotificationClick = vi.fn();
    render(
      <CnNotificationCenter
        mode="inline"
        notifications={MIXED}
        selectable
        onMarkRead={onMarkRead}
        onDismissMany={onDismissMany}
        onNotificationClick={onNotificationClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar notificaciones" }));
    fireEvent.click(screen.getByText("Factura"));
    fireEvent.click(screen.getByText("Respaldo"));
    expect(onNotificationClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Marcar leídas" }));
    expect(onMarkRead).toHaveBeenCalledWith(["n1", "o1"], true);
    fireEvent.click(screen.getByLabelText("Seleccionar todo"));
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(onDismissMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "u1" })]),
    );
  });
});

describe("CnNotificationCenter · contenido enriquecido", () => {
  it("renders progress, image and deep link", () => {
    render(
      <CnNotificationCenter
        mode="inline"
        notifications={[
          {
            id: "p",
            title: "Exportando",
            href: "/reportes/1",
            progress: { value: 45, label: "45% · 100 filas" },
            image: { src: "data:image/png;base64,AA==", alt: "Vista previa" },
          },
          { id: "q", title: "Importando", progress: { status: "running" } },
        ]}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "45% · 100 filas" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );
    expect(screen.getByRole("progressbar", { name: "En proceso…" })).not.toHaveAttribute(
      "aria-valuenow",
    );
    expect(screen.getByRole("img", { name: "Vista previa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exportando" })).toHaveAttribute("href", "/reportes/1");
  });

  it("shows loading on async button actions without opening the notification", async () => {
    let resolve: () => void = () => {};
    const onApprove = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const onNotificationClick = vi.fn();
    render(
      <CnNotificationCenter
        mode="inline"
        onNotificationClick={onNotificationClick}
        notifications={[
          {
            id: "a",
            title: "Aprobar compra",
            actions: [
              { id: "ok", label: "Aprobar", appearance: "button", onClick: onApprove },
              { id: "no", label: "Rechazar", appearance: "button", onClick: vi.fn() },
            ],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(onApprove).toHaveBeenCalled();
    expect(onNotificationClick).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Rechazar" })).toBeDisabled());
    await act(async () => resolve());
    await waitFor(() => expect(screen.getByRole("button", { name: "Rechazar" })).toBeEnabled());
  });
});

describe("CnNotificationCenter · alertas y estado", () => {
  const Live = (props: Partial<CnNotificationCenterProps>) => {
    const [items, setItems] = useState(DATA);
    return (
      <>
        <button
          onClick={() =>
            setItems((prev) => [
              {
                id: `new-${prev.length}`,
                title: "Nuevo pedido",
                time: Date.now(),
                source: "Ventas",
              },
              ...prev,
            ])
          }
        >
          push
        </button>
        <CnNotificationCenter notifications={items} preview {...props} />
      </>
    );
  };

  it("does not preview, chime or vibrate in do-not-disturb, and can turn it off", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    const onDnd = vi.fn();
    render(<Live defaultDoNotDisturb vibrate onDoNotDisturbChange={onDnd} />);
    expect(screen.getByRole("button", { name: /no molestar activado/ })).toBeInTheDocument();
    fireEvent.click(screen.getByText("push"));
    expect(screen.queryByRole("region", { name: "Notificaciones nuevas" })).not.toBeInTheDocument();
    expect(vibrate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Notificaciones/ }));
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(onDnd).toHaveBeenCalledWith(false);
  });

  it("chimes and vibrates on arrival when opted in, but not for muted sources", () => {
    const oscillators: number[] = [];
    class FakeAudio {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        oscillators.push(1);
        return {
          type: "",
          frequency: { value: 0 },
          connect: (n: unknown) => n,
          start: () => {},
          stop: () => {},
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: (n: unknown) => n,
        };
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudio;
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    const { unmount } = render(<Live sound vibrate />);
    fireEvent.click(screen.getByText("push"));
    expect(oscillators.length).toBeGreaterThan(0);
    expect(vibrate).toHaveBeenCalled();
    unmount();

    oscillators.length = 0;
    const onNew = vi.fn();
    render(<Live sound mutedSources={["Ventas"]} onNewNotifications={onNew} />);
    fireEvent.click(screen.getByText("push"));
    expect(onNew).toHaveBeenCalled();
    expect(oscillators).toHaveLength(0);
    expect(screen.queryByRole("region", { name: "Notificaciones nuevas" })).not.toBeInTheDocument();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it("shows the connection state in the bell and the panel", () => {
    const onReconnect = vi.fn();
    render(
      <CnNotificationCenter
        notifications={DATA}
        connection="offline"
        onReconnect={onReconnect}
        panel="popover"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sin conexión/ }));
    expect(screen.getByText(/Sin conexión\. Las nuevas llegarán/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReconnect).toHaveBeenCalled();
  });

  it("toggles the panel with the hotkey", () => {
    render(<CnNotificationCenter notifications={DATA} hotkey="alt+n" panel="popover" />);
    const bell = screen.getByRole("button", { name: /Notificaciones/ });
    expect(bell).toHaveAttribute("aria-keyshortcuts", "Alt+N");
    fireEvent.keyDown(window, { key: "n", code: "KeyN", altKey: true });
    expect(screen.getByRole("dialog", { name: "Notificaciones" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "n", code: "KeyN" });
    expect(screen.getByRole("dialog", { name: "Notificaciones" })).toBeInTheDocument();
  });

  it("opens the built-in settings view with DND, categories and muted sources", () => {
    const onCategoryChange = vi.fn();
    const onMuteSource = vi.fn();
    const onDnd = vi.fn();
    render(
      <CnNotificationCenter
        mode="inline"
        notifications={[{ ...DATA[0], source: "Facturación" }]}
        onDoNotDisturbChange={onDnd}
        mutedSources={["Facturación"]}
        onMuteSource={onMuteSource}
        settings={{
          categories: [{ id: "fact", label: "Facturación", enabled: true }],
          onCategoryChange,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Configurar notificaciones" }));
    expect(screen.getByText("Preferencias")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /No molestar/ }));
    expect(onDnd).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("switch", { name: /^Facturación/ }));
    expect(onCategoryChange).toHaveBeenCalledWith("fact", false);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));
    expect(onMuteSource).toHaveBeenCalledWith("Facturación", false);
    fireEvent.click(screen.getByRole("button", { name: "Volver a las notificaciones" }));
    expect(screen.getByText("Factura A-1024 timbrada")).toBeInTheDocument();
  });
});

describe("notification-utils", () => {
  it("matches hotkeys by key or physical code and formats them", () => {
    const ev = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);
    expect(matchesHotkey(ev({ key: "n", altKey: true }), "alt+n")).toBe(true);
    expect(matchesHotkey(ev({ key: "ñ", code: "KeyN", altKey: true }), "alt+n")).toBe(true);
    expect(matchesHotkey(ev({ key: "n", altKey: true, shiftKey: true }), "alt+n")).toBe(false);
    expect(matchesHotkey(ev({ key: "n" }), "alt+n")).toBe(false);
    expect(formatHotkey("ctrl+shift+k")).toBe("Ctrl+Shift+K");
  });

  it("detects snoozed notifications and source keys", () => {
    const base = new Date(2026, 0, 1, 12);
    expect(isSnoozed({ id: "a", title: "a", snoozedUntil: base.getTime() + 1000 }, base)).toBe(
      true,
    );
    expect(isSnoozed({ id: "a", title: "a", snoozedUntil: base.getTime() - 1000 }, base)).toBe(
      false,
    );
    expect(notificationSourceKey({ id: "a", title: "a", source: <b>Nómina</b> })).toBe("Nómina");
    expect(notificationSourceKey({ id: "a", title: "a", source: "X", sourceId: "x" })).toBe("x");
    const tomorrow = CN_NOTIFICATION_SNOOZE_OPTIONS[1].until(base);
    expect(tomorrow.getDate()).toBe(2);
    expect(tomorrow.getHours()).toBe(9);
  });
});

describe("useBrowserNotifications", () => {
  it("reports unsupported without the Notification API", () => {
    let api: ReturnType<typeof useBrowserNotifications> | null = null;
    const Probe = () => {
      api = useBrowserNotifications();
      return null;
    };
    const original = (window as { Notification?: unknown }).Notification;
    delete (window as { Notification?: unknown }).Notification;
    render(<Probe />);
    expect(api!.supported).toBe(false);
    expect(api!.permission).toBe("unsupported");
    expect(api!.notify("x")).toBeNull();
    if (original) (window as { Notification?: unknown }).Notification = original;
  });

  it("requests permission and notifies when granted", async () => {
    const instances: string[] = [];
    class FakeNotification {
      static permission: NotificationPermission = "default";
      static requestPermission = vi.fn(async () => {
        FakeNotification.permission = "granted";
        return "granted" as NotificationPermission;
      });
      onclick: (() => void) | null = null;
      constructor(title: string) {
        instances.push(title);
      }
      close() {}
    }
    const original = (window as { Notification?: unknown }).Notification;
    (window as { Notification?: unknown }).Notification = FakeNotification;
    let api: ReturnType<typeof useBrowserNotifications> | null = null;
    const Probe = () => {
      api = useBrowserNotifications();
      return null;
    };
    render(<Probe />);
    await act(async () => {
      await api!.requestPermission();
    });
    expect(api!.permission).toBe("granted");
    api!.notify("Hola");
    expect(instances).toEqual(["Hola"]);
    (window as { Notification?: unknown }).Notification = original;
  });
});
