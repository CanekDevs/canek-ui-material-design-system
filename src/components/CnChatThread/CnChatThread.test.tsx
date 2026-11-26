import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CnChatThread } from "./CnChatThread";
import type { CnChatThreadProps } from "./CnChatThread";
import { CnChatThreadSkeleton } from "./CnChatThreadSkeleton";
import { CHAT_MESSAGES, CHAT_NOW, CHAT_PARTICIPANTS } from "./chat-sample";
import { continuesPrevious, dayLabel } from "./thread-utils";

const setup = (props: Partial<CnChatThreadProps> = {}) =>
  render(
    <CnChatThread
      messages={CHAT_MESSAGES}
      participants={CHAT_PARTICIPANTS}
      currentUserId="yo"
      now={CHAT_NOW}
      {...props}
    />,
  );

describe("thread-utils", () => {
  it("nombra los días como Hoy, Ayer, día de la semana o fecha", () => {
    const now = new Date(2026, 10, 26, 12);
    expect(dayLabel(new Date(2026, 10, 26, 8), now)).toBe("Hoy");
    expect(dayLabel(new Date(2026, 10, 25, 23), now)).toBe("Ayer");
    expect(dayLabel(new Date(2026, 10, 23), now)).toBe("Lunes");
    expect(dayLabel(new Date(2026, 9, 1), now)).toMatch(/1 de octubre/);
    expect(dayLabel(new Date(2025, 9, 1), now)).toMatch(/2025/);
  });

  it("agrupa solo mismo autor, mismo día y dentro de la ventana", () => {
    const a = { authorId: "x", time: new Date(2026, 0, 1, 10, 0) };
    expect(
      continuesPrevious(a, { authorId: "x", time: new Date(2026, 0, 1, 10, 4) }, 300_000),
    ).toBe(true);
    expect(
      continuesPrevious(a, { authorId: "x", time: new Date(2026, 0, 1, 10, 6) }, 300_000),
    ).toBe(false);
    expect(
      continuesPrevious(a, { authorId: "y", time: new Date(2026, 0, 1, 10, 1) }, 300_000),
    ).toBe(false);
    expect(continuesPrevious(undefined, a, 300_000)).toBe(false);
  });
});

describe("CnChatThread", () => {
  it("es un registro con nombre, separadores de día y mensajes", () => {
    setup();
    const log = screen.getByRole("log", { name: "Conversación" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(within(log).getByRole("separator", { name: "Ayer" })).toBeInTheDocument();
    expect(within(log).getByRole("separator", { name: "Hoy" })).toBeInTheDocument();
    expect(within(log).getByRole("note")).toHaveTextContent("abrió la conversación");
    expect(within(log).getAllByRole("article").length).toBe(7);
  });

  it("agrupa mensajes seguidos del mismo autor (sin repetir el nombre)", () => {
    setup();
    // m1 y m2 son de Lucía en un minuto: su nombre aparece una vez ese día
    const log = screen.getByRole("log");
    expect(within(log).getAllByText("Lucía Méndez")).toHaveLength(2);
  });

  it("con error ofrece reintentar el mensaje", async () => {
    const onRetry = vi.fn();
    setup({ onRetry });
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "m7" }));
  });

  it("Intro envía, Mayús + Intro no, y el campo se limpia al enviar", async () => {
    const onSend = vi.fn();
    setup({ onSend });
    const box = screen.getByRole("textbox", { name: "Escribe un mensaje…" });
    const send = screen.getByRole("button", { name: "Enviar mensaje" });
    expect(send).toBeDisabled();
    await userEvent.type(box, "Hola{Shift>}{Enter}{/Shift}equipo");
    expect(onSend).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith("Hola\nequipo");
    await waitFor(() => expect(box).toHaveValue(""));
  });

  it("no envía mensajes vacíos", () => {
    const onSend = vi.fn();
    setup({ onSend });
    const box = screen.getByRole("textbox", { name: "Escribe un mensaje…" });
    fireEvent.change(box, { target: { value: "   " } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("carga mensajes anteriores desde el botón", async () => {
    const onLoadOlder = vi.fn();
    const { rerender } = setup({ hasOlder: true, onLoadOlder });
    await userEvent.click(screen.getByRole("button", { name: "Ver mensajes anteriores" }));
    expect(onLoadOlder).toHaveBeenCalled();
    rerender(
      <CnChatThread
        messages={CHAT_MESSAGES}
        participants={CHAT_PARTICIPANTS}
        now={CHAT_NOW}
        hasOlder
        onLoadOlder={onLoadOlder}
        loadingOlder
      />,
    );
    expect(screen.getByRole("button", { name: /Cargando mensajes anteriores/ })).toBeDisabled();
    expect(screen.getByRole("log")).toHaveAttribute("aria-busy", "true");
  });

  it("muestra quién está escribiendo", () => {
    const { rerender } = setup({ typing: ["Lucía"] });
    expect(screen.getByText("Lucía está escribiendo…")).toBeInTheDocument();
    rerender(<CnChatThread messages={[]} participants={{}} typing={["A", "B", "C"]} />);
    expect(screen.getByText("3 personas están escribiendo…")).toBeInTheDocument();
  });

  it("avisa mensajes nuevos cuando el usuario leía más arriba", async () => {
    const { rerender } = setup();
    const log = screen.getByRole("log");
    Object.defineProperty(log, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(log, "clientHeight", { configurable: true, value: 400 });
    log.scrollTop = 100;
    fireEvent.scroll(log);
    rerender(
      <CnChatThread
        messages={[
          ...CHAT_MESSAGES,
          { id: "nuevo", authorId: "lucia", content: "¿Sigues ahí?", time: CHAT_NOW },
        ]}
        participants={CHAT_PARTICIPANTS}
        currentUserId="yo"
        now={CHAT_NOW}
      />,
    );
    const button = await screen.findByRole("button", { name: /1 mensaje nuevo/ });
    await userEvent.click(button);
    expect(screen.queryByRole("button", { name: /mensaje nuevo/ })).not.toBeInTheDocument();
  });

  it("muestra el texto vacío sin mensajes", () => {
    setup({ messages: [] });
    expect(screen.getByText("Todavía no hay mensajes. Escribe el primero.")).toBeInTheDocument();
  });

  it("acepta un redactor propio", () => {
    setup({ composer: <input aria-label="Mi redactor" />, onSend: vi.fn() });
    expect(screen.getByRole("textbox", { name: "Mi redactor" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar mensaje" })).not.toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    setup({ skeleton: true });
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
  });
});

describe("CnChatThreadSkeleton", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<CnChatThreadSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "chat-thread");
  });
});
