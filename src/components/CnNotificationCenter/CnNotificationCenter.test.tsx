import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CnNotificationCenter } from "./CnNotificationCenter";
import type { CnNotification } from "./CnNotificationCenter.types";
import { CnNotificationCenterSkeleton } from "./CnNotificationCenterSkeleton";
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
