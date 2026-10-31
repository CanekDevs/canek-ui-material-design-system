import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnTextField } from "./CnTextField";

const meta: Meta<typeof CnTextField> = {
  title: "Components/CnTextField",
  component: CnTextField,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "tel", "url", "number", "search", "password", "textarea"],
    },
    variant: { control: "select", options: ["outlined", "filled", "standard"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    transform: {
      control: "select",
      options: ["none", "uppercase", "lowercase", "capitalize", "numeric", "currency"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CnTextField>;

export const Default: Story = {
  args: { label: "Nombre", placeholder: "Escribe tu nombre" },
};

export const Types: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <CnTextField label="Texto" type="text" />
      <CnTextField label="Email" type="email" />
      <CnTextField label="Teléfono" type="tel" />
      <CnTextField label="URL" type="url" />
      <CnTextField label="Número" type="number" />
      <CnTextField label="Búsqueda" type="search" />
      <CnTextField label="Contraseña" type="password" />
      <CnTextField label="Textarea" type="textarea" minRows={3} />
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <CnTextField label="Outlined" variant="outlined" />
      <CnTextField label="Filled" variant="filled" />
      <CnTextField label="Standard" variant="standard" />
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <CnTextField label="Small" size="sm" />
      <CnTextField label="Medium" size="md" />
      <CnTextField label="Large" size="lg" />
    </Stack>
  ),
};

export const WithHelperText: Story = {
  args: { label: "Correo", helperText: "Ingresa tu email principal" },
};

export const ExternalError: Story = {
  args: { label: "Correo", error: true, helperText: "Formato inválido" },
};

export const Disabled: Story = {
  args: { label: "Nombre", disabled: true, value: "Contenido" },
};

export const ReadOnly: Story = {
  args: { label: "Nombre", readOnly: true, value: "No editable" },
};

export const Required: Story = {
  args: { label: "Nombre", required: true },
};

const PasswordStory = () => {
  const [value, setValue] = useState("");
  return (
    <CnTextField
      label="Contraseña"
      type="password"
      passwordToggle
      value={value}
      onChange={setValue}
      rules={[{ type: "passwordStrength", level: "medium" }]}
    />
  );
};

export const PasswordWithToggle: Story = { render: () => <PasswordStory /> };

const ClearableStory = () => {
  const [value, setValue] = useState("Contenido inicial");
  return <CnTextField label="Con clearable" clearable value={value} onChange={setValue} />;
};

export const Clearable: Story = { render: () => <ClearableStory /> };

const CounterStory = () => {
  const [value, setValue] = useState("");
  return (
    <CnTextField
      label="Con contador"
      maxLength={30}
      showCounter
      value={value}
      onChange={setValue}
    />
  );
};

export const WithCounter: Story = { render: () => <CounterStory /> };

const LoadingStory = () => {
  return <CnTextField label="Cargando" loading value="Cargando..." />;
};

export const Loading: Story = { render: () => <LoadingStory /> };

export const WithStartIcon: Story = {
  args: { label: "Buscar", startIcon: "search" },
};

export const WithEndIcon: Story = {
  args: { label: "Usuario", endIcon: "person" },
};

export const UppercaseTransform: Story = {
  args: { label: "Mayúsculas", transform: "uppercase" },
};

export const CapitalizeTransform: Story = {
  args: { label: "Capitalizado", transform: "capitalize" },
};

export const NumericValidation: Story = {
  args: {
    label: "Solo números",
    rules: [{ type: "numeric" }],
  },
};

const EmailValidationStory = () => {
  const [value, setValue] = useState("");
  return (
    <CnTextField
      label="Email validado"
      type="email"
      value={value}
      onChange={setValue}
      rules={[{ type: "email" }, { type: "required" }]}
    />
  );
};

export const EmailValidation: Story = { render: () => <EmailValidationStory /> };

const MultiFieldStory = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  return (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <CnTextField
        label="Nombre"
        value={form.name}
        onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
        rules={[{ type: "required" }]}
        transform="capitalize"
      />
      <CnTextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => setForm((prev) => ({ ...prev, email: v }))}
        rules={[{ type: "required" }, { type: "email" }]}
      />
      <CnTextField
        label="Contraseña"
        type="password"
        passwordToggle
        value={form.password}
        onChange={(v) => setForm((prev) => ({ ...prev, password: v }))}
        rules={[{ type: "required" }, { type: "passwordStrength", level: "medium" }]}
      />
    </Stack>
  );
};

export const CompleteForm: Story = { render: () => <MultiFieldStory /> };

export const WithAdornments: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <CnTextField
        label="Precio"
        startAdornment={<span style={{ paddingRight: 4 }}>$</span>}
        endAdornment={<span style={{ paddingLeft: 4 }}>MXN</span>}
      />
      <CnTextField label="Buscar" startIcon="search" endIcon="clear" />
    </Stack>
  ),
};

export const TextareaAuto: Story = {
  render: () => (
    <CnTextField
      label="Comentarios"
      type="textarea"
      minRows={4}
      maxRows={8}
      helperText="Máximo 500 caracteres"
      maxLength={500}
      showCounter
    />
  ),
};

export const FormContextValidation: Story = {
  args: {
    label: "Confirmación",
    rules: [{ type: "equalTo", field: "password", message: "No coincide con password" }],
    formValues: { password: "secreto" },
  },
};
