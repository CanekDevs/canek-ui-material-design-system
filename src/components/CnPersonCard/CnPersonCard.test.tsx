import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CnPersonCard } from "./CnPersonCard";
import { CnPersonCardGroup } from "./CnPersonCardGroup";
import { CnPersonCardSkeleton } from "./CnPersonCardSkeleton";
import { resolvePersonEvent } from "./person-event";

const TODAY = new Date(2026, 10, 19); // 19 nov 2026

describe("resolvePersonEvent", () => {
  it("computes birthdays relative to today", () => {
    expect(resolvePersonEvent({ type: "birthday", date: "1990-11-19" }, TODAY)).toMatchObject({
      countdown: "¡Hoy!",
      isToday: true,
      days: 0,
    });
    expect(resolvePersonEvent({ type: "birthday", date: "1990-11-20" }, TODAY).countdown).toBe(
      "Mañana",
    );
    expect(resolvePersonEvent({ type: "birthday", date: "1990-11-14" }, TODAY).countdown).toBe(
      "Hace 5 días",
    );
    // Nearest occurrence crosses the year boundary.
    const january = resolvePersonEvent({ type: "birthday", date: "1990-01-03" }, TODAY);
    expect(january.when?.getFullYear()).toBe(2027);
    expect(
      resolvePersonEvent({ type: "birthday", date: "1990-11-25", showAge: true }, TODAY).badge,
    ).toBe("36 años");
  });

  it("computes anniversary years and new hires", () => {
    const anniversary = resolvePersonEvent({ type: "anniversary", date: "2021-11-22" }, TODAY);
    expect(anniversary.badge).toBe("5 años");
    expect(anniversary.countdown).toBe("En 3 días");
    expect(resolvePersonEvent({ type: "new-hire", date: "2026-11-21" }, TODAY).countdown).toBe(
      "Ingresa en 2 días",
    );
    expect(resolvePersonEvent({ type: "new-hire", date: "2026-11-19" }, TODAY).countdown).toBe(
      "Hoy es su primer día",
    );
  });

  it("computes leave periods", () => {
    expect(
      resolvePersonEvent({ type: "vacation", date: "2026-11-24", endDate: "2026-11-28" }, TODAY)
        .countdown,
    ).toBe("Sale en 5 días");
    expect(
      resolvePersonEvent({ type: "leave", date: "2026-11-17", endDate: "2026-11-21" }, TODAY)
        .countdown,
    ).toBe("Regresa en 3 días");
    expect(
      resolvePersonEvent({ type: "leave", date: "2026-11-10", endDate: "2026-11-12" }, TODAY)
        .countdown,
    ).toBe("Ya regresó");
  });
});

describe("CnPersonCard", () => {
  it("renders the person, event context and contact links", () => {
    render(
      <CnPersonCard
        name="María Pérez"
        role="Diseñadora"
        department="Producto"
        email="maria@canek.mx"
        phone="+52 55 1234 5678"
        whatsapp
        event={{ type: "birthday", date: "1992-11-20" }}
        today={TODAY}
      />,
    );
    expect(screen.getByRole("article", { name: "María Pérez" })).toBeInTheDocument();
    expect(screen.getByText("Cumpleaños")).toBeInTheDocument();
    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.getByText("Diseñadora")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enviar correo a María Pérez" })).toHaveAttribute(
      "href",
      "mailto:maria@canek.mx",
    );
    expect(screen.getByRole("link", { name: "Llamar a María Pérez" })).toHaveAttribute(
      "href",
      "tel:+525512345678",
    );
    expect(screen.getByRole("link", { name: "WhatsApp a María Pérez" })).toHaveAttribute(
      "href",
      "https://wa.me/525512345678",
    );
  });

  it("highlights today's event and runs quick actions", () => {
    const onCongrats = vi.fn();
    const { container } = render(
      <CnPersonCard
        layout="vertical"
        cover
        name="Luis Gómez"
        event={{ type: "anniversary", date: "2016-11-19" }}
        quickActions={[{ label: "Felicitar", icon: "celebration", onClick: onCongrats }]}
        today={TODAY}
      />,
    );
    expect(container.querySelector("[data-today='true']")).not.toBeNull();
    expect(container.querySelector("[data-cn-person-cover]")).not.toBeNull();
    expect(screen.getByText("10 años")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Felicitar" }));
    expect(onCongrats).toHaveBeenCalled();
  });

  it("renders details, tags and an eyebrow override", () => {
    render(
      <CnPersonCard
        name="Ana"
        eyebrow="Bienvenida"
        details={[{ label: "Área", value: "Finanzas" }]}
        tags={["Remoto"]}
      />,
    );
    expect(screen.getByText("Bienvenida")).toBeInTheDocument();
    expect(screen.getByText("Finanzas")).toBeInTheDocument();
    expect(screen.getByText("Remoto")).toBeInTheDocument();
  });

  it("renders the compact layout without contact buttons", () => {
    const { container } = render(
      <CnPersonCard layout="compact" name="Eva" email="eva@canek.mx" hideContact />,
    );
    expect(container.querySelector("[data-cn-person-card='compact']")).not.toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the skeleton via the skeleton prop", () => {
    render(<CnPersonCard name="Eva" skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "person-card");
    expect(screen.queryByText("Eva")).not.toBeInTheDocument();
  });
});

describe("CnPersonCardGroup", () => {
  const people = [
    { id: 5, name: "Pronto", event: { type: "birthday" as const, date: "1990-11-22" } },
    { id: 1, name: "Pasado", event: { type: "birthday" as const, date: "1990-11-10" } },
    { id: 2, name: "Lejano", event: { type: "birthday" as const, date: "1990-11-29" } },
    { id: 3, name: "Hoy", event: { type: "birthday" as const, date: "1990-11-19" } },
    { id: 4, name: "Diciembre", event: { type: "birthday" as const, date: "1990-12-02" } },
  ];

  it("sorts by proximity, filters by month and badges today's count", () => {
    render(
      <CnPersonCardGroup
        title="Cumpleaños del mes"
        icon="cake"
        people={people}
        month="current"
        today={TODAY}
      />,
    );
    const names = within(screen.getByRole("list"))
      .getAllByRole("listitem")
      .map((item) => item.querySelector("[id]")?.textContent);
    expect(names).toEqual(["Hoy", "Pronto", "Lejano", "Pasado"]);
    expect(screen.getByText("1 hoy")).toBeInTheDocument();
  });

  it("limits the list with maxVisible", () => {
    render(<CnPersonCardGroup title="Todos" people={people} maxVisible={2} today={TODAY} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Ver todos (5)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("groups by proximity", () => {
    render(<CnPersonCardGroup title="Grupos" people={people} groupByProximity today={TODAY} />);
    expect(screen.getByText("Próximos días")).toBeInTheDocument();
    expect(screen.getByText("Más adelante")).toBeInTheDocument();
    expect(screen.getByText("Pasados")).toBeInTheDocument();
  });

  it("shows the empty state and skeletons", () => {
    const { rerender } = render(<CnPersonCardGroup title="Vacío" people={[]} />);
    expect(screen.getByText("Sin eventos")).toBeInTheDocument();
    rerender(<CnPersonCardGroup title="Cargando" people={[]} skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "person-card-group");
  });
});

describe("CnPersonCardSkeleton", () => {
  it("follows the layout", () => {
    const { container, rerender } = render(
      <CnPersonCardSkeleton layout="vertical" cover contacts={2} quickActions={1} />,
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelector("[data-cn-person-skeleton-cover]")).not.toBeNull();
    expect(container.querySelector("[data-cn-person-skeleton-actions]")?.children).toHaveLength(3);
    rerender(<CnPersonCardSkeleton layout="compact" />);
    expect(container.querySelector("[data-cn-person-skeleton='compact']")).not.toBeNull();
  });
});
