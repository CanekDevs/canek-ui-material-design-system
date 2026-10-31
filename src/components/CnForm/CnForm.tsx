import CloseIcon from "@mui/icons-material/Close";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { FormEvent, MutableRefObject, ReactNode } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { mergeSx } from "../../utils/field-styles";
import { moveArrayItem } from "../../utils/use-sortable-list";
import { CnAlert } from "../CnAlert";
import { CnButton } from "../CnButton";
import { CnSkeleton } from "../CnSkeleton";
import { CnTabs } from "../CnTabs";
import type { CnLayoutGroup, CnResolvedField } from "./CnForm.engine";
import {
  buildInitialValues,
  buildSectionItem,
  collectGroupFields,
  evaluate,
  getFirstErrorPath,
  getLayoutGroups,
  getSectionItems,
  isCustomElement,
  resolveVariant,
} from "./CnForm.engine";
import {
  buildFormData,
  getNestedValue,
  getServerErrorMessage,
  hasFiles,
  omitPaths,
  parseServerErrors,
} from "./CnForm.helpers";
import type {
  CnFormFieldOrCustom,
  CnFormHandle,
  CnFormHelpers,
  CnFormLabels,
  CnFormProps,
  CnFormSection,
  CnFormSectionContext,
  CnFormStep,
  CnFormTab,
  CnFormValues,
} from "./CnForm.types";
import { CnFormFieldControl, renderCustomElement } from "./CnFormField";
import { CnFormSectionView } from "./CnFormSection";
import { useCnFormState } from "./useCnFormState";

export const CN_FORM_DEFAULT_LABELS: CnFormLabels = {
  submit: "Guardar",
  submitting: "Guardando…",
  cancel: "Cancelar",
  next: "Siguiente",
  back: "Atrás",
  add: "Agregar",
  remove: "Eliminar",
  moveUp: "Subir",
  moveDown: "Bajar",
  expand: "Expandir",
  collapse: "Contraer",
  optional: "Opcional",
  errorSummaryTitle: "Revisa los campos marcados",
  errorSummaryDescription: (count) =>
    `Hay ${count} ${count === 1 ? "campo" : "campos"} con errores.`,
  discardTitle: "¿Descartar cambios?",
  discardMessage: "Tienes cambios sin guardar. Si sales ahora se perderán.",
  discardConfirm: "Descartar",
  discardCancel: "Seguir editando",
  stepOf: (current, total) => `Paso ${current} de ${total}`,
};

const FOCUSABLE =
  'input:not([type="hidden"]):not([hidden]):not([disabled]), textarea:not([disabled]), [role="combobox"], [role="button"][tabindex="0"], [tabindex="0"]';

const isGroupVisible = (group: CnLayoutGroup, values: CnFormValues): boolean => {
  const visibleWhen = (group as { visibleWhen?: (v: CnFormValues) => boolean }).visibleWhen;
  return !visibleWhen || visibleWhen(values);
};

const FormSkeleton = ({ rows = 4, columns = 1 }: { rows?: number; columns?: number }) => (
  <Grid container spacing={2} aria-busy="true" aria-label="Cargando formulario">
    {Array.from({ length: rows * Math.max(1, columns) }, (_, index) => (
      <Grid key={index} size={{ xs: 12, md: 12 / Math.max(1, columns) }}>
        <CnSkeleton variant="text" width="35%" height={12} sx={{ mb: "6px" }} />
        <CnSkeleton variant="rounded" height={40} />
      </Grid>
    ))}
  </Grid>
);

export const CnForm = forwardRef<HTMLFormElement, CnFormProps>(function CnForm(props, ref) {
  const {
    fields,
    sections,
    tabs,
    steps,
    value,
    defaultValues,
    onChange,
    onSubmit,
    onCancel,
    onSuccess,
    onError,
    onDirtyChange,
    title,
    description,
    size = "md",
    columns = 1,
    submitLabel,
    cancelLabel,
    submitIcon = "save",
    cancelIcon,
    submitButtonProps,
    cancelButtonProps,
    extraActions,
    actionsAlign = "end",
    stickyActions = false,
    hideActions = false,
    showSubmitButton = true,
    showCancelButton,
    labels: labelsProp,
    isSubmitting: isSubmittingProp = false,
    isLoading = false,
    loadingStates,
    disabled = false,
    readOnly = false,
    validateOn = "blur",
    serverError,
    error,
    errorSummary = "inline",
    scrollToFirstError = true,
    resetAfterSubmit = false,
    resetOnCancel = false,
    warnOnUnsavedChanges = false,
    submitMode = "json",
    buildPayload,
    excludeFields,
    omitHiddenFields = false,
    dateFormat,
    activeTab: activeTabProp,
    onTabChange,
    tabsOrientation = "horizontal",
    activeStep: activeStepProp,
    onStepChange,
    stepperOrientation = "horizontal",
    allowStepNavigation = true,
    mode = "inline",
    open = true,
    onClose,
    dialogMaxWidth = "md",
    dialogFullScreen,
    dialogHeaderRight,
    formRef,
    externalSubmitRef,
    allFieldsForValidation,
    id: idProp,
    sx,
    className,
    fieldSx,
  } = props;

  const autoId = useId().replace(/:/g, "");
  const formId = idProp ?? `cn-form-${autoId}`;
  const labels = useMemo(() => ({ ...CN_FORM_DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  const variant = resolveVariant(props);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const groups = useMemo(
    () => getLayoutGroups(variant, { fields, sections, tabs, steps }),
    [variant, fields, sections, tabs, steps],
  );

  // Defaults calculados una sola vez: son el destino de reset().
  const [initialValues] = useState(() =>
    buildInitialValues(groups, (defaultValues ?? {}) as CnFormValues),
  );

  const resolveFields = useCallback(
    (vals: CnFormValues): CnResolvedField[] => {
      const out: CnResolvedField[] = [];
      for (const group of groups)
        out.push(...collectGroupFields(group, vals, isGroupVisible(group, vals)));
      if (allFieldsForValidation?.length) {
        const known = new Set(out.map((item) => item.path));
        const extra = collectGroupFields({ id: "__extra", fields: allFieldsForValidation }, vals);
        out.push(...extra.filter((item) => !known.has(item.path)));
      }
      return out;
    },
    [allFieldsForValidation, groups],
  );

  const form = useCnFormState({
    value: value as CnFormValues | undefined,
    initialValues,
    onChange: onChange as ((patch: CnFormValues, values: CnFormValues) => void) | undefined,
    onDirtyChange,
    validateOn,
    serverError,
    resolveFields,
  });
  const { values } = form;
  const formLatest = useRef(form);
  formLatest.current = form;

  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const isSubmitting = isSubmittingProp || internalSubmitting;
  const [showSummary, setShowSummary] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const formElRef = useRef<HTMLFormElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLFormElement | null) => {
      formElRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<HTMLFormElement | null>).current = node;
    },
    [ref],
  );

  useEffect(() => {
    const message = serverError ? getServerErrorMessage(serverError) : undefined;
    const hasFieldErrors = Object.keys(parseServerErrors(serverError)).length > 0;
    setGeneralError(serverError && !hasFieldErrors ? (message ?? null) : null);
  }, [serverError]);

  // ─── Pestañas y pasos ────────────────────────────────────────────────
  const visibleTabs = useMemo(
    () => (tabs ?? []).filter((tab) => !tab.visibleWhen || tab.visibleWhen(values)),
    [tabs, values],
  );
  const [tabState, setTabState] = useState<string | undefined>(activeTabProp ?? tabs?.[0]?.id);
  const requestedTab = activeTabProp ?? tabState;
  const currentTab: CnFormTab | undefined =
    visibleTabs.find((tab) => tab.id === requestedTab) ?? visibleTabs[0];
  const changeTab = useCallback(
    (tabId: string) => {
      setTabState(tabId);
      onTabChange?.(tabId);
    },
    [onTabChange],
  );

  const visibleSteps = useMemo(
    () => (steps ?? []).filter((step) => !step.visibleWhen || step.visibleWhen(values)),
    [steps, values],
  );
  const [stepState, setStepState] = useState(activeStepProp ?? 0);
  const stepIndex = Math.min(
    Math.max(activeStepProp ?? stepState, 0),
    Math.max(visibleSteps.length - 1, 0),
  );
  const currentStep: CnFormStep | undefined = visibleSteps[stepIndex];
  const isLastStep = stepIndex >= visibleSteps.length - 1;
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]));
  const goToStep = useCallback(
    (index: number) => {
      setStepState(index);
      setVisitedSteps((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
      onStepChange?.(index);
      formElRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    },
    [onStepChange],
  );

  // ─── Secciones repetibles: claves estables por elemento ──────────────
  const itemKeysRef = useRef<Record<string, string[]>>({});
  const keyCounterRef = useRef(0);
  const getItemKeys = (sectionId: string, length: number): string[] => {
    const keys = itemKeysRef.current[sectionId] ?? [];
    while (keys.length < length) keys.push(`item-${(keyCounterRef.current += 1)}`);
    if (keys.length > length) keys.length = length;
    itemKeysRef.current[sectionId] = keys;
    return keys;
  };

  const isCollapsed = useCallback(
    (key: string) => {
      if (key in collapsed) return collapsed[key];
      const sectionId = key.split(":")[0];
      const section = groups.flatMap((g) => g.sections ?? []).find((s) => s.id === sectionId);
      return Boolean(section?.defaultCollapsed);
    },
    [collapsed, groups],
  );
  const toggleCollapsed = useCallback(
    (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !isCollapsed(key) })),
    [isCollapsed],
  );

  const addItem = (section: CnFormSection) => {
    const items = getSectionItems(form.valuesRef.current, section.id);
    if (section.maxItems !== undefined && items.length >= section.maxItems) return;
    const keys = getItemKeys(section.id, items.length);
    keys.push(`item-${(keyCounterRef.current += 1)}`);
    setCollapsed((prev) => ({ ...prev, [`${section.id}:${keys[keys.length - 1]}`]: false }));
    form.setValueAt(section.id, [...items, buildSectionItem(section, form.valuesRef.current)]);
  };

  const removeItem = (section: CnFormSection, index: number) => {
    const items = getSectionItems(form.valuesRef.current, section.id);
    if (items.length <= (section.minItems ?? 0)) return;
    getItemKeys(section.id, items.length).splice(index, 1);
    form.setValueAt(
      section.id,
      items.filter((_, i) => i !== index),
    );
  };

  const moveItem = (section: CnFormSection, from: number, to: number) => {
    const items = getSectionItems(form.valuesRef.current, section.id);
    if (from === to || to < 0 || to >= items.length) return;
    const keys = getItemKeys(section.id, items.length);
    itemKeysRef.current[section.id] = moveArrayItem(keys, from, to);
    form.setValueAt(section.id, moveArrayItem(items, from, to));
  };

  // ─── Conteo de errores por grupo / sección / elemento ────────────────
  const errorIndex = useMemo(() => {
    const counts: Record<string, number> = {};
    const bump = (key: string) => {
      counts[key] = (counts[key] ?? 0) + 1;
    };
    for (const item of form.resolvedFields) {
      if (!form.visibleErrors[item.path]) continue;
      bump(`group:${item.groupId}`);
      if (item.sectionId) bump(`section:${item.sectionId}`);
      if (item.ctx) bump(`item:${item.ctx.sectionId}:${item.ctx.index}`);
    }
    return counts;
  }, [form.resolvedFields, form.visibleErrors]);

  const labelByPath = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of form.resolvedFields) {
      const label = evaluate(item.field.label, values, item.ctx) ?? item.field.name;
      map[item.path] = item.ctx ? `${label} (${item.ctx.index + 1})` : label;
    }
    return map;
  }, [form.resolvedFields, values]);

  // ─── Foco en el primer error ─────────────────────────────────────────
  const focusField = useCallback(
    (path: string) => {
      const resolved = formLatest.current.resolvedFields.find((item) => item.path === path);
      if (resolved) {
        if (variant === "tabbed" && resolved.groupId !== currentTab?.id)
          changeTab(resolved.groupId);
        if (variant === "wizard") {
          const target = visibleSteps.findIndex((step) => step.id === resolved.groupId);
          if (target !== -1 && target !== stepIndex) goToStep(target);
        }
        if (resolved.sectionId) {
          setCollapsed((prev) => {
            const next = { ...prev, [resolved.sectionId as string]: false };
            if (resolved.ctx) {
              const key = itemKeysRef.current[resolved.ctx.sectionId]?.[resolved.ctx.index];
              if (key) next[`${resolved.ctx.sectionId}:${key}`] = false;
            }
            return next;
          });
        }
      }
      // Espera a que la pestaña/paso/sección se renderice.
      setTimeout(() => {
        const root = formElRef.current;
        if (!root) return;
        const cell = Array.from(root.querySelectorAll<HTMLElement>("[data-cn-field-path]")).find(
          (node) => node.dataset.cnFieldPath === path,
        );
        if (!cell) return;
        if (scrollToFirstError && typeof cell.scrollIntoView === "function") {
          cell.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        cell.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
      }, 60);
    },
    [changeTab, currentTab?.id, goToStep, scrollToFirstError, stepIndex, variant, visibleSteps],
  );

  const focusFirstError = useCallback(
    (errors: Record<string, string>) => {
      const path = getFirstErrorPath(formLatest.current.resolvedFields, errors);
      if (path) focusField(path);
    },
    [focusField],
  );

  // ─── Helpers / payload / envío ───────────────────────────────────────
  const helpers: CnFormHelpers = useMemo(
    () => ({
      reset: (next) => formLatest.current.reset(next ?? initialValues),
      setErrors: (errors) => {
        formLatest.current.setServerErrors((prev) => ({ ...prev, ...errors }));
        setShowSummary(true);
      },
      setFieldValue: (path, next) => formLatest.current.setFieldValue(path, next),
    }),
    [initialValues],
  );

  const buildSubmitPayload = useCallback(
    (current: CnFormValues): CnFormValues | FormData => {
      let data = current;
      if (omitHiddenFields) {
        const hidden = formLatest.current.resolvedFields
          .filter((item) => !item.visible)
          .map((item) => item.path);
        data = omitPaths(data, hidden);
      }
      if (buildPayload) data = buildPayload(data as never);
      if (excludeFields?.length && submitMode === "json") data = omitPaths(data, excludeFields);
      const asFormData = submitMode === "formdata" || (submitMode === "auto" && hasFiles(data));
      return asFormData ? buildFormData(data, { excludeFields, dateFormat }) : data;
    },
    [buildPayload, dateFormat, excludeFields, omitHiddenFields, submitMode],
  );

  const blocked = disabled || readOnly;

  const executeSubmit = useCallback(async (): Promise<boolean> => {
    if (blocked || submittingRef.current || isSubmittingProp) return false;
    const state = formLatest.current;
    state.setSubmitCount((count) => count + 1);
    state.setServerErrors({});
    setGeneralError(null);

    const errors = await state.validate();
    if (Object.keys(errors).length > 0) {
      setShowSummary(true);
      focusFirstError(errors);
      return false;
    }

    setShowSummary(false);
    const current = state.valuesRef.current;
    submittingRef.current = true;
    setInternalSubmitting(true);
    try {
      await onSubmit?.(buildSubmitPayload(current) as never, { values: current as never, helpers });
      onSuccess?.();
      if (resetAfterSubmit) {
        formLatest.current.reset(initialValues);
      } else {
        formLatest.current.markSaved();
        formLatest.current.setSubmitCount(0);
      }
      return true;
    } catch (caught) {
      const fieldErrors = parseServerErrors(caught);
      const hasFieldErrors = Object.keys(fieldErrors).length > 0;
      formLatest.current.setServerErrors(fieldErrors);
      setGeneralError(
        getServerErrorMessage(caught) ??
          (hasFieldErrors ? null : "No se pudo guardar. Intenta de nuevo."),
      );
      if (hasFieldErrors) {
        setShowSummary(true);
        focusFirstError(fieldErrors);
      }
      onError?.(caught);
      return false;
    } finally {
      submittingRef.current = false;
      setInternalSubmitting(false);
    }
  }, [
    blocked,
    buildSubmitPayload,
    focusFirstError,
    helpers,
    initialValues,
    isSubmittingProp,
    onError,
    onSubmit,
    onSuccess,
    resetAfterSubmit,
  ]);

  const executeSubmitRef = useRef(executeSubmit);
  executeSubmitRef.current = executeSubmit;

  useEffect(() => {
    if (!externalSubmitRef) return;
    externalSubmitRef.current = () => executeSubmitRef.current();
    return () => {
      externalSubmitRef.current = null;
    };
  }, [externalSubmitRef]);

  useImperativeHandle(
    formRef,
    (): CnFormHandle => ({
      ...helpers,
      submit: () => executeSubmitRef.current(),
      validate: async () => {
        const errors = await formLatest.current.validate();
        formLatest.current.setSubmitCount((count) => count + 1);
        return Object.keys(errors).length === 0;
      },
      getValues: () => formLatest.current.valuesRef.current,
      isDirty: () => formLatest.current.dirtyRef.current,
    }),
    [helpers],
  );

  const handleNext = useCallback(async () => {
    if (!currentStep) return;
    const state = formLatest.current;
    const stepPaths = state.resolvedFields
      .filter((item) => item.groupId === currentStep.id && item.visible)
      .map((item) => item.path);
    state.touch(stepPaths);
    const errors = await state.validate(stepPaths);
    const custom = currentStep.validate?.(state.valuesRef.current) ?? {};
    const all = { ...errors, ...custom };
    if (Object.keys(custom).length) state.setServerErrors((prev) => ({ ...prev, ...custom }));
    if (Object.keys(all).length > 0) {
      focusFirstError(all);
      return;
    }
    goToStep(stepIndex + 1);
  }, [currentStep, focusFirstError, goToStep, stepIndex]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (variant === "wizard" && !isLastStep) {
      void handleNext();
      return;
    }
    void executeSubmit();
  };

  // ─── Cambios sin guardar ─────────────────────────────────────────────
  useEffect(() => {
    if (!warnOnUnsavedChanges || !form.isDirty || isSubmitting) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.isDirty, isSubmitting, warnOnUnsavedChanges]);

  const finishCancel = useCallback(() => {
    setConfirmDiscard(false);
    if (resetOnCancel) formLatest.current.reset(initialValues);
    if (mode === "modal") (onClose ?? onCancel)?.();
    else onCancel?.();
  }, [initialValues, mode, onCancel, onClose, resetOnCancel]);

  const requestCancel = useCallback(() => {
    if (isSubmitting) return;
    if (warnOnUnsavedChanges && formLatest.current.dirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    finishCancel();
  }, [finishCancel, isSubmitting, warnOnUnsavedChanges]);

  const runExtraAction = async (key: string) => {
    const action = extraActions?.find((item) => item.key === key);
    if (!action || action.disabled || isSubmitting) return;
    if (action.validate) {
      formLatest.current.setSubmitCount((count) => count + 1);
      const errors = await formLatest.current.validate();
      if (Object.keys(errors).length) {
        setShowSummary(true);
        focusFirstError(errors);
        return;
      }
    }
    setActionLoading(key);
    try {
      await action.onClick(formLatest.current.valuesRef.current, helpers);
    } catch (caught) {
      setGeneralError(getServerErrorMessage(caught) ?? "No se pudo completar la acción.");
      onError?.(caught);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render de campos ────────────────────────────────────────────────
  const handlersRef = useRef<
    Record<string, { onChange: (v: unknown) => void; onBlur: () => void }>
  >({});
  const handlersFor = (path: string) => {
    let handlers = handlersRef.current[path];
    if (!handlers) {
      handlers = {
        onChange: (next) => formLatest.current.setFieldValue(path, next),
        onBlur: () => formLatest.current.blur(path),
      };
      handlersRef.current[path] = handlers;
    }
    return handlers;
  };
  const setValueStable = useCallback(
    (path: string, next: unknown) => formLatest.current.setFieldValue(path, next),
    [],
  );

  const renderFieldGrid = (
    list: readonly CnFormFieldOrCustom[] | undefined,
    gridColumns: number,
    prefix?: string,
    ctx?: CnFormSectionContext,
  ): ReactNode => {
    if (!list?.length) return null;
    return (
      <Grid container columnSpacing={2} rowSpacing={1.5} sx={{ width: "100%" }}>
        {list.map((item, index) => {
          if (isCustomElement(item)) {
            if (item.visibleWhen && !item.visibleWhen(values, ctx)) return null;
            return renderCustomElement(item.component, item, `custom-${prefix ?? ""}-${index}`);
          }
          if (item.visibleWhen && !item.visibleWhen(values, ctx)) return null;
          const path = prefix ? `${prefix}.${item.name}` : item.name;
          const handlers = handlersFor(path);
          return (
            <CnFormFieldControl
              key={path}
              field={item}
              path={path}
              value={getNestedValue(values, path)}
              error={form.getError(path)}
              formValues={values}
              sectionContext={ctx}
              disabled={disabled || isSubmitting}
              readOnly={readOnly}
              size={size}
              columns={gridColumns}
              onChange={handlers.onChange}
              onBlur={handlers.onBlur}
              onSetValue={setValueStable}
            />
          );
        })}
      </Grid>
    );
  };

  const renderSection = (section: CnFormSection) => {
    if (section.visibleWhen && !section.visibleWhen(values)) return null;
    const items = section.repeatable ? getSectionItems(values, section.id) : [];
    const keys = section.repeatable ? getItemKeys(section.id, items.length) : [];
    const sectionColumns = section.columns ?? columns;
    const loading = loadingStates?.sections?.[section.id] ? (
      <FormSkeleton
        rows={Math.ceil(section.fields.length / sectionColumns)}
        columns={sectionColumns}
      />
    ) : undefined;
    return (
      <CnFormSectionView
        key={section.id}
        section={section}
        values={values}
        labels={labels}
        disabled={disabled || readOnly || isSubmitting}
        loading={loading}
        items={items}
        itemKeys={keys}
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        errorCount={(index) =>
          index === undefined
            ? (errorIndex[`section:${section.id}`] ?? 0)
            : (errorIndex[`item:${section.id}:${index}`] ?? 0)
        }
        canAdd={
          (evaluate(section.canAdd, values) ?? true) &&
          (section.maxItems === undefined || items.length < section.maxItems)
        }
        canRemove={
          (evaluate(section.canRemove, values) ?? true) && items.length > (section.minItems ?? 0)
        }
        canReorder={Boolean(evaluate(section.canReorder, values))}
        onAdd={() => addItem(section)}
        onRemove={(index) => removeItem(section, index)}
        onMove={(from, to) => moveItem(section, from, to)}
        renderFields={(index) =>
          index === undefined
            ? renderFieldGrid(section.fields, sectionColumns)
            : renderFieldGrid(section.fields, sectionColumns, `${section.id}.${index}`, {
                sectionId: section.id,
                index,
                item: items[index],
              })
        }
      />
    );
  };

  const renderGroup = (group: {
    fields?: readonly CnFormFieldOrCustom[];
    sections?: readonly CnFormSection[];
  }) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {renderFieldGrid(group.fields, columns)}
      {group.sections?.map(renderSection)}
    </Box>
  );

  const groupFieldCount = (group?: { fields?: readonly unknown[] }) =>
    Math.max(group?.fields?.length ?? 4, 2);

  const renderBody = (): ReactNode => {
    if (isLoading) {
      return (
        <FormSkeleton
          rows={Math.ceil(groupFieldCount(groups[0]) / Math.max(columns, 1))}
          columns={columns}
        />
      );
    }

    if (variant === "tabbed") {
      if (!currentTab) return null;
      const panelId = `${formId}-panel-${currentTab.id}`;
      const vertical = tabsOrientation === "vertical";
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: vertical ? "row" : "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          <CnTabs
            options={visibleTabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
              subtitle: tab.subtitle,
              icon: tab.icon,
              disabled: tab.disabled,
              hasError: (errorIndex[`group:${tab.id}`] ?? 0) > 0,
              isLoading: loadingStates?.tabs?.[tab.id],
            }))}
            value={currentTab.id}
            onChange={(next) => changeTab(String(next))}
            orientation={tabsOrientation}
            variant="line"
          />
          <Box
            role="tabpanel"
            id={panelId}
            aria-label={currentTab.label}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {currentTab.description && (
              <Typography
                sx={{
                  mb: "12px",
                  fontSize: "var(--cn-font-size-sm, 12px)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {currentTab.description}
              </Typography>
            )}
            {loadingStates?.tabs?.[currentTab.id] ? (
              <FormSkeleton
                rows={Math.ceil(groupFieldCount(currentTab) / Math.max(columns, 1))}
                columns={columns}
              />
            ) : (
              renderGroup(currentTab)
            )}
          </Box>
        </Box>
      );
    }

    if (variant === "wizard") {
      if (!currentStep) return null;
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: stepperOrientation === "vertical" && !isMobile ? "row" : "column",
            gap: "20px",
          }}
        >
          {isMobile ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Typography
                sx={{
                  fontSize: "var(--cn-font-size-xs, 11px)",
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {labels.stepOf(stepIndex + 1, visibleSteps.length)}
              </Typography>
              <Box
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={visibleSteps.length}
                aria-valuenow={stepIndex + 1}
                aria-valuetext={labels.stepOf(stepIndex + 1, visibleSteps.length)}
                sx={{
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${((stepIndex + 1) / visibleSteps.length) * 100}%`,
                    backgroundColor: "var(--cn-color-brand-600, #254d87)",
                    transition: "width 200ms ease",
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Stepper
              activeStep={stepIndex}
              orientation={stepperOrientation}
              nonLinear={allowStepNavigation}
              sx={{
                flexShrink: 0,
                "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": {
                  color: "var(--cn-color-brand-600, #254d87)",
                },
                "& .MuiStepLabel-label": { fontSize: "var(--cn-font-size-sm, 12px)" },
                "& .MuiStepIcon-root.Mui-error, & .MuiStepLabel-label.Mui-error": {
                  color: "var(--cn-color-error-500, #d63c3c)",
                },
              }}
            >
              {visibleSteps.map((step, index) => {
                const stepErrors = errorIndex[`group:${step.id}`] ?? 0;
                const label = (
                  <StepLabel
                    error={stepErrors > 0}
                    optional={
                      step.optional ? (
                        <Typography
                          sx={{
                            fontSize: "var(--cn-font-size-xs, 11px)",
                            color: "var(--cn-color-text-muted, #6e7682)",
                          }}
                        >
                          {labels.optional}
                        </Typography>
                      ) : undefined
                    }
                  >
                    {step.title}
                  </StepLabel>
                );
                const canJump =
                  allowStepNavigation &&
                  visitedSteps.has(index) &&
                  index !== stepIndex &&
                  !isSubmitting;
                return (
                  <Step key={step.id} completed={index < stepIndex}>
                    {allowStepNavigation ? (
                      <StepButton
                        onClick={() => canJump && goToStep(index)}
                        disabled={!canJump && index !== stepIndex}
                      >
                        {label}
                      </StepButton>
                    ) : (
                      label
                    )}
                  </Step>
                );
              })}
            </Stepper>
          )}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {(isMobile || currentStep.description) && (
              <Box>
                {isMobile && (
                  <Typography
                    component="h3"
                    sx={{ m: 0, fontSize: "var(--cn-font-size-md, 14px)", fontWeight: 600 }}
                  >
                    {currentStep.title}
                  </Typography>
                )}
                {currentStep.description && (
                  <Typography
                    sx={{
                      fontSize: "var(--cn-font-size-sm, 12px)",
                      color: "var(--cn-color-text-muted, #6e7682)",
                    }}
                  >
                    {currentStep.description}
                  </Typography>
                )}
              </Box>
            )}
            {loadingStates?.steps?.[currentStep.id] ? (
              <FormSkeleton
                rows={Math.ceil(groupFieldCount(currentStep) / Math.max(columns, 1))}
                columns={columns}
              />
            ) : (
              renderGroup(currentStep)
            )}
          </Box>
        </Box>
      );
    }

    return renderGroup(groups[0] ?? {});
  };

  // ─── Alertas ─────────────────────────────────────────────────────────
  const summaryEntries = Object.entries(form.visibleErrors);
  const summaryVisible = errorSummary !== "none" && showSummary && summaryEntries.length > 0;

  const renderAlerts = () => (
    <>
      {error && (
        <CnAlert severity="error" variant="outlined">
          {error}
        </CnAlert>
      )}
      {generalError && (
        <CnAlert severity="error" variant="outlined" closable onClose={() => setGeneralError(null)}>
          {generalError}
        </CnAlert>
      )}
      {summaryVisible && errorSummary === "inline" && (
        <CnAlert severity="error" variant="outlined" role="alert">
          <AlertTitle
            sx={{ fontSize: "var(--cn-font-size-base, 13px)", fontWeight: 600, mb: "2px" }}
          >
            {labels.errorSummaryTitle}
          </AlertTitle>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span>{labels.errorSummaryDescription(summaryEntries.length)}</span>
            <Box
              component="ul"
              sx={{ m: 0, pl: "18px", display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {summaryEntries.slice(0, 8).map(([path, message]) => (
                <li key={path}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => focusField(path)}
                    sx={{
                      all: "unset",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                      "&:focus-visible": { outline: "2px solid currentColor", outlineOffset: 2 },
                    }}
                  >
                    {labelByPath[path] ? `${labelByPath[path]}: ` : ""}
                    {message}
                  </Box>
                </li>
              ))}
            </Box>
          </Box>
        </CnAlert>
      )}
      {summaryVisible && errorSummary === "toast" && (
        <CnAlert
          mode="popup"
          open
          severity="error"
          title={labels.errorSummaryTitle}
          message={labels.errorSummaryDescription(summaryEntries.length)}
          closable
          onClose={() => setShowSummary(false)}
          autoHideDuration={5000}
        />
      )}
    </>
  );

  // ─── Acciones ────────────────────────────────────────────────────────
  const actionsDisabled = blocked || isSubmitting || isLoading;
  const resolvedShowCancel = showCancelButton ?? Boolean(onCancel || (mode === "modal" && onClose));
  const stretch = actionsAlign === "stretch";
  const isWizard = variant === "wizard";

  const renderActions = () => {
    if (hideActions) return null;
    const extras = extraActions?.map((action) => (
      <CnButton
        key={action.key}
        type="button"
        variant={action.variant ?? "outlined"}
        color={action.color ?? "neutral"}
        startIcon={action.icon}
        loading={actionLoading === action.key}
        disabled={
          actionsDisabled ||
          action.disabled ||
          (actionLoading !== null && actionLoading !== action.key)
        }
        fullWidth={stretch}
        onClick={() => void runExtraAction(action.key)}
      >
        {action.label}
      </CnButton>
    ));

    const main = (
      <>
        {resolvedShowCancel && (
          <CnButton
            type="button"
            variant={cancelButtonProps?.variant ?? "outlined"}
            color={cancelButtonProps?.color ?? "neutral"}
            size={cancelButtonProps?.size ?? "medium"}
            fullWidth={cancelButtonProps?.fullWidth ?? stretch}
            startIcon={cancelButtonProps?.icon ?? cancelIcon}
            disabled={isSubmitting || cancelButtonProps?.disabled}
            onClick={requestCancel}
          >
            {cancelButtonProps?.label ?? cancelLabel ?? labels.cancel}
          </CnButton>
        )}
        {isWizard && stepIndex > 0 && (
          <CnButton
            type="button"
            variant="outlined"
            color="neutral"
            startIcon="arrow_back"
            fullWidth={stretch}
            disabled={isSubmitting}
            onClick={() => goToStep(stepIndex - 1)}
          >
            {labels.back}
          </CnButton>
        )}
        {isWizard && !isLastStep ? (
          <CnButton
            type="submit"
            variant="contained"
            color="primary"
            endIcon="arrow_forward"
            fullWidth={stretch}
            disabled={actionsDisabled}
          >
            {labels.next}
          </CnButton>
        ) : (
          showSubmitButton &&
          (onSubmit || isWizard) && (
            <CnButton
              type="submit"
              variant={submitButtonProps?.variant ?? "contained"}
              color={submitButtonProps?.color ?? "primary"}
              size={submitButtonProps?.size ?? "medium"}
              fullWidth={submitButtonProps?.fullWidth ?? stretch}
              loading={isSubmitting}
              disabled={actionsDisabled || submitButtonProps?.disabled}
              startIcon={submitButtonProps?.icon ?? submitIcon}
            >
              {isSubmitting
                ? labels.submitting
                : (submitButtonProps?.label ?? submitLabel ?? labels.submit)}
            </CnButton>
          )
        )}
      </>
    );

    const hasContent =
      Boolean(extras?.length) || resolvedShowCancel || showSubmitButton || isWizard;
    if (!hasContent) return null;

    return (
      <Box
        data-cn-form-actions
        sx={{
          display: "flex",
          flexDirection: stretch ? "column-reverse" : "row",
          alignItems: stretch ? "stretch" : "center",
          justifyContent:
            actionsAlign === "start"
              ? "flex-start"
              : actionsAlign === "between"
                ? "space-between"
                : "flex-end",
          gap: "8px",
          flexWrap: "wrap",
          ...(stickyActions &&
            mode === "inline" && {
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              paddingBlock: "12px",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              borderTop: "1px solid var(--cn-color-border, #dde0e4)",
            }),
        }}
      >
        {actionsAlign === "between" ? (
          <>
            <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{extras}</Box>
            <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{main}</Box>
          </>
        ) : (
          <>
            {extras}
            {main}
          </>
        )}
      </Box>
    );
  };

  const header = (title || description) && (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {title && (
        <Typography
          component="h2"
          id={`${formId}-title`}
          sx={{
            m: 0,
            fontSize: "var(--cn-font-size-xl, 18px)",
            fontWeight: 700,
            color: "var(--cn-color-text, #222831)",
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
      )}
      {description && (
        <Typography
          component="div"
          sx={{
            fontSize: "var(--cn-font-size-sm, 12px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );

  const discardDialog = (
    <Dialog
      open={confirmDiscard}
      onClose={() => setConfirmDiscard(false)}
      maxWidth="xs"
      fullWidth
      aria-labelledby={`${formId}-discard-title`}
    >
      <DialogTitle
        id={`${formId}-discard-title`}
        sx={{ fontSize: "var(--cn-font-size-lg, 16px)", fontWeight: 600 }}
      >
        {labels.discardTitle}
      </DialogTitle>
      <DialogContent
        sx={{
          fontSize: "var(--cn-font-size-base, 13px)",
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        {labels.discardMessage}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <CnButton variant="outlined" color="neutral" onClick={() => setConfirmDiscard(false)}>
          {labels.discardCancel}
        </CnButton>
        <CnButton variant="contained" color="error" onClick={finishCancel}>
          {labels.discardConfirm}
        </CnButton>
      </DialogActions>
    </Dialog>
  );

  const formProps = {
    ref: setRefs,
    id: formId,
    component: "form" as const,
    onSubmit: handleSubmit,
    noValidate: true,
    "aria-busy": isSubmitting || isLoading || undefined,
    "aria-labelledby": title ? `${formId}-title` : undefined,
    "data-cn-form": variant,
    className,
  };

  if (mode === "modal") {
    return (
      <>
        <Dialog
          open={open}
          onClose={(_, reason) => {
            if (reason === "backdropClick" && (isSubmitting || form.isDirty)) return;
            requestCancel();
          }}
          maxWidth={dialogMaxWidth}
          fullWidth
          fullScreen={dialogFullScreen ?? isMobile}
          aria-labelledby={title ? `${formId}-title` : undefined}
          slotProps={{
            paper: {
              sx: {
                borderRadius: (dialogFullScreen ?? isMobile) ? 0 : "var(--cn-radius-lg, 12px)",
              },
            },
          }}
        >
          <Box
            {...formProps}
            sx={mergeSx({ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }, sx)}
          >
            <DialogTitle
              component="div"
              sx={{ display: "flex", alignItems: "flex-start", gap: "12px", pr: "12px" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>{header}</Box>
              {dialogHeaderRight}
              <IconButton
                aria-label="Cerrar"
                onClick={requestCancel}
                disabled={isSubmitting}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent
              dividers
              sx={mergeSx({ display: "flex", flexDirection: "column", gap: "16px" }, fieldSx)}
            >
              {renderAlerts()}
              {renderBody()}
            </DialogContent>
            {!hideActions && <DialogActions sx={{ px: 3, py: 2 }}>{renderActions()}</DialogActions>}
          </Box>
        </Dialog>
        {discardDialog}
      </>
    );
  }

  return (
    <>
      <Box
        {...formProps}
        sx={mergeSx(
          {
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
          },
          sx,
        )}
      >
        {header}
        {renderAlerts()}
        <Box sx={mergeSx({ display: "flex", flexDirection: "column", gap: "16px" }, fieldSx)}>
          {renderBody()}
        </Box>
        {!hideActions && (
          <>
            {!stickyActions && <Divider sx={{ marginBlock: "4px" }} />}
            {renderActions()}
          </>
        )}
      </Box>
      {discardDialog}
    </>
  );
});
