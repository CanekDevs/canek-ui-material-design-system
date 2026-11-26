import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CnChatMessage, formatChatTime } from "./CnChatMessage";
import { CnChatMessageSkeleton } from "./CnChatMessageSkeleton";

const AT = new Date(2026, 10, 26, 10, 42);

describe("CnChatMessage", () => {
  it("es un artículo con autor, hora y contenido", () => {
    render(
      <CnChatMessage author={{ name: "Lucía Méndez" }} time={AT}>
        Hola
      </CnChatMessage>,
    );
    const article = screen.getByRole("article");
    expect(article).toHaveAccessibleName(expect.stringContaining("Lucía Méndez"));
    expect(within(article).getByText("Hola")).toBeInTheDocument();
    expect(within(article).getByText("Lucía Méndez")).toBeInTheDocument();
    expect(article.querySelector("time")).toHaveAttribute("dateTime", AT.toISOString());
  });

  it("los propios no muestran nombre y anuncian su estado", () => {
    render(
      <CnChatMessage own author={{ name: "Yo" }} time={AT} status="read">
        Listo
      </CnChatMessage>,
    );
    expect(screen.queryByText("Yo")).not.toBeInTheDocument();
    expect(screen.getByText("Leído")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAccessibleName(expect.stringContaining("Tú"));
  });

  it("un mensaje con error ofrece reintentar", async () => {
    const onRetry = vi.fn();
    render(
      <CnChatMessage own status="error" onRetry={onRetry}>
        Falló
      </CnChatMessage>,
    );
    expect(screen.getByText("No se envió")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("agrupado oculta avatar y nombre", () => {
    render(
      <CnChatMessage grouped author={{ name: "Lucía" }}>
        Sigo
      </CnChatMessage>,
    );
    expect(screen.queryByText("Lucía")).not.toBeInTheDocument();
  });

  it("abre el menú de acciones con teclado y ejecuta la elegida", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CnChatMessage actions={[{ id: "r", label: "Responder", icon: "reply", onClick }]}>
        Hola
      </CnChatMessage>,
    );
    const button = screen.getByRole("button", { name: "Acciones del mensaje" });
    button.focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu", { name: "Acciones del mensaje" });
    await user.click(within(menu).getByRole("menuitem", { name: /Responder/ }));
    expect(onClick).toHaveBeenCalled();
  });

  it("lista los adjuntos como enlaces de descarga con tamaño", () => {
    render(
      <CnChatMessage
        attachments={[{ id: "1", name: "cotizacion.pdf", url: "/c.pdf", size: 248_000 }]}
      />,
    );
    const list = screen.getByRole("list", { name: "Adjuntos" });
    const link = within(list).getByRole("link", { name: /cotizacion\.pdf/ });
    expect(link).toHaveAttribute("download", "cotizacion.pdf");
    expect(within(list).getByText("242 KB")).toBeInTheDocument();
  });

  it("el aviso del sistema es una nota centrada", () => {
    render(<CnChatMessage variant="system">Lucía se unió</CnChatMessage>);
    expect(screen.getByRole("note")).toHaveTextContent("Lucía se unió");
  });

  it("formatea la hora y tolera fechas inválidas", () => {
    expect(formatChatTime(AT).short).toMatch(/10:42/);
    expect(formatChatTime("no es fecha").short).toBe("no es fecha");
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(<CnChatMessage>{long}</CnChatMessage>);
    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<CnChatMessage skeleton>Hola</CnChatMessage>);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Hola")).not.toBeInTheDocument();
  });
});

describe("CnChatMessageSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnChatMessageSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "chat-message");
  });
});
