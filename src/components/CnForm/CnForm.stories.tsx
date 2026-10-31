import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnForm } from "./CnForm";
import type { CnFormField } from "./CnForm.types";

const meta: Meta<typeof CnForm> = {
  title: "Components/CnForm",
  component: CnForm,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CnForm>;

const SimpleFormStory = () => {
  const [value, setValue] = useState<Record<string, unknown>>({
    name: "",
    email: "",
    password: "",
    age: "",
    bio: "",
    role: "",
    newsletter: false,
    active: true,
  });

  const fields: CnFormField[] = [
    { name: "name", type: "text", label: "Nombre completo", required: true, autoComplete: "name" },
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true,
      autoComplete: "email",
      rules: [{ type: "email" }],
    },
    {
      name: "password",
      type: "password",
      label: "Contraseña",
      required: true,
      rules: [{ type: "minLength", value: 8 }],
    },
    { name: "age", type: "number", label: "Edad", rules: [{ type: "min", value: 18 }] },
    { name: "bio", type: "textarea", label: "Biografía", minRows: 3, maxRows: 6 },
    {
      name: "role",
      type: "select",
      label: "Rol",
      options: [
        { value: "admin", label: "Administrador" },
        { value: "user", label: "Usuario" },
        { value: "guest", label: "Invitado" },
      ],
    },
    { name: "newsletter", type: "checkbox", label: "Recibir newsletter" },
    { name: "active", type: "switch", label: "Cuenta activa" },
  ];

  return (
    <CnForm
      fields={fields}
      value={value}
      onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
      onSubmit={(values) => {
        alert(`Submitted: ${JSON.stringify(values, null, 2)}`);
      }}
      onCancel={() => alert("Canceled")}
      title="Crear usuario"
      description="Completa los datos para crear la cuenta."
      columns={2}
    />
  );
};

export const Default: Story = {
  render: () => <SimpleFormStory />,
};

const ValidationStory = () => {
  const [value, setValue] = useState<Record<string, unknown>>({ email: "", password: "" });

  const fields: CnFormField[] = [
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true,
      rules: [{ type: "email" }],
    },
    {
      name: "password",
      type: "password",
      label: "Contraseña",
      required: true,
      rules: [{ type: "passwordStrength", level: "medium" }],
    },
    {
      name: "confirm",
      type: "password",
      label: "Confirmar contraseña",
      required: true,
      rules: [{ type: "equalTo", field: "password", message: "Las contraseñas no coinciden" }],
    },
  ];

  return (
    <CnForm
      fields={fields}
      value={value}
      onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
      onSubmit={() => alert("OK")}
      submitLabel="Registrarse"
    />
  );
};

export const Validation: Story = {
  render: () => <ValidationStory />,
};
