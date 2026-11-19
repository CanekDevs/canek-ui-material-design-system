import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CnProfileCard, planActions } from "./CnProfileCard";
import { CnProfileCardGroup } from "./CnProfileCardGroup";

const TODAY = new Date(2026, 10, 19);

const mockWidth = (width: number) =>
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width,
    height: 100,
    top: 0,
    left: 0,
    right: width,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);

afterEach(() => vi.restoreAllMocks());

describe("planActions", () => {
  const entries = [{ width: 120, primary: true }, { width: 100 }, { width: 32 }];

  it("keeps everything when it fits or the width is unknown", () => {
    expect(planActions(entries, Infinity).overflow).toHaveLength(0);
    expect(planActions(entries, 300).overflow).toHaveLength(0);
  });

  it("moves what does not fit to the menu and keeps the primary action", () => {
    const tight = planActions(entries, 200);
    expect(tight.inline).toEqual([entries[0]]);
    expect(tight.overflow).toHaveLength(2);
    // Ni siquiera la principal cabe: queda visible (truncada) y el resto va al menú.
    expect(planActions(entries, 60).inline).toEqual([entries[0]]);
    // Compacto: todo puede ir al menú.
    expect(planActions(entries, 0, false).inline).toHaveLength(0);
  });
});

describe("CnProfileCard (responsive)", () => {
  it("collapses contacts and secondary actions into a menu when narrow", () => {
    mockWidth(260);
    const onMessage = vi.fn();
    const email = "maria.fernanda.perez.castaneda@direccion-transformacion-digital.canek.mx";
    const { container } = render(
      <CnProfileCard
        name="María Fernanda de los Ángeles Pérez-Castañeda y Villaseñor Montenegro"
        email={email}
        phone="+52 55 1234 5678"
        quickActions={[
          { label: "Felicitar públicamente", icon: "celebration" },
          { label: "Enviar mensaje directo", icon: "chat", onClick: onMessage },
        ]}
        today={TODAY}
      />,
    );
    // Los contactos dejan la columna derecha.
    expect(container.querySelector("[data-cn-profile-contacts]")).toBeNull();
    expect(screen.getByRole("button", { name: "Felicitar públicamente" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Más acciones para María Fernanda/ }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: email })).toHaveAttribute(
      "href",
      `mailto:${email}`,
    );
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Enviar mensaje directo" }));
    expect(onMessage).toHaveBeenCalled();
  });

  it("keeps everything inline when wide", () => {
    mockWidth(900);
    const { container } = render(
      <CnProfileCard
        name="Ana"
        email="ana@canek.mx"
        quickActions={[{ label: "Felicitar" }, { label: "Mensaje" }]}
      />,
    );
    expect(container.querySelector("[data-cn-profile-more]")).toBeNull();
    expect(container.querySelector("[data-cn-profile-contacts]")).not.toBeNull();
  });

  it("sends compact quick actions to the menu and the event under the name when narrow", () => {
    mockWidth(320);
    const { container } = render(
      <CnProfileCard
        layout="compact"
        name="Ana"
        event={{ type: "birthday", date: "1990-11-20" }}
        quickActions={[{ label: "Felicitar" }]}
        today={TODAY}
      />,
    );
    expect(container.querySelector("[data-cn-profile-more]")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Felicitar" })).not.toBeInTheDocument();
    const name = container.querySelector("[data-cn-profile-name]") as HTMLElement;
    expect(name.parentElement?.querySelector("[data-cn-profile-event]")).not.toBeNull();
  });

  it("stacks details on narrow cards", () => {
    mockWidth(240);
    const { container } = render(
      <CnProfileCard
        layout="vertical"
        name="Ana"
        details={[{ label: "Jefe", value: "Alejandro Maximiliano Rodríguez de la Fuente" }]}
      />,
    );
    const dl = container.querySelector("[data-cn-profile-details]") as HTMLElement;
    expect(getComputedStyle(dl).gridTemplateColumns).toBe("minmax(0, 1fr)");
  });

  it("summarises extra tags and exposes long names in full", () => {
    const long = "Nombre extremadamente largo de una persona con muchos apellidos compuestos";
    render(<CnProfileCard name={long} tags={["A", "B", "C", "D", "E"]} maxTags={2} />);
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();
    expect(screen.getByTitle(long)).toBeInTheDocument();
  });

  it("renders an empty profile without extra sections", () => {
    const { container } = render(<CnProfileCard name="Sin datos" />);
    expect(screen.getByRole("article", { name: "Sin datos" })).toBeInTheDocument();
    expect(container.querySelector("[data-cn-profile-actions]")).toBeNull();
    expect(container.querySelector("[data-cn-profile-tags]")).toBeNull();
  });

  it("never lets the grid columns exceed a narrow container", () => {
    const { container } = render(
      <CnProfileCardGroup layout="grid" minCardWidth={260} people={[{ name: "A" }]} />,
    );
    const list = container.querySelector("[role='list']") as HTMLElement;
    expect(list.getAttribute("class")).toBeTruthy();
    expect(getComputedStyle(list).gridTemplateColumns).toContain("min(260px, 100%)");
  });
});
