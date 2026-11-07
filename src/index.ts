export { CnButton } from "./components/CnButton";
export type {
  CnButtonColor,
  CnButtonLoadingPosition,
  CnButtonProps,
  CnButtonShape,
  CnButtonSize,
  CnButtonVariant,
} from "./components/CnButton";

export { CnIcon, ICON_REGISTRY, registerIcons } from "./components/CnIcon";
export type { CnIconColor, CnIconProps, CnIconSize } from "./components/CnIcon";

export { CnChip } from "./components/CnChip";
export type {
  CnChipColor,
  CnChipProps,
  CnChipShape,
  CnChipSize,
  CnChipVariant,
} from "./components/CnChip";

export { CnAlert } from "./components/CnAlert";
export type {
  CnAlertCloseReason,
  CnAlertColor,
  CnAlertIconMode,
  CnAlertMode,
  CnAlertProps,
  CnAlertRole,
  CnAlertSeverity,
  CnAlertVariant,
} from "./components/CnAlert";

export { CnCard, CnCardBody, CnCardFooter, CnCardHeader, CnCardMedia } from "./components/CnCard";
export type {
  CnCardAccentPosition,
  CnCardDividerPosition,
  CnCardHeaderIcon,
  CnCardIconColor,
  CnCardLayout,
  CnCardPadding,
  CnCardProps,
  CnCardRadius,
  CnCardShadow,
  CnCardSize,
  CnCardVariant,
} from "./components/CnCard";

export { CnAvatar, CnAvatarGroup } from "./components/CnAvatar";
export type {
  CnAvatarBadge,
  CnAvatarBadgeColor,
  CnAvatarColor,
  CnAvatarGroupProps,
  CnAvatarGroupSpacing,
  CnAvatarProps,
  CnAvatarSize,
  CnAvatarStatus,
  CnAvatarVariant,
} from "./components/CnAvatar";

export { CnEmptyState } from "./components/CnEmptyState";
export type {
  CnEmptyStateColor,
  CnEmptyStateProps,
  CnEmptyStateSize,
  CnEmptyStateVariant,
} from "./components/CnEmptyState";

export {
  CnFieldSkeleton,
  CnSkeleton,
  CnSkeletonGroup,
  SkBlock,
  SkLabeled,
  SkLines,
  SkText,
  useSkeletonGroup,
  varyWidth,
} from "./components/CnSkeleton";
export type {
  CnFieldSkeletonProps,
  CnSkeletonAnimation,
  CnSkeletonCommonProps,
  CnSkeletonGroupProps,
  CnSkeletonProps,
  CnSkeletonVariant,
} from "./components/CnSkeleton";

// Gráficas: skeletons, tarjeta, paleta y formatos (sin @mui/x-charts).
// Las gráficas están en "@canek-ui/material-design-system/charts".
export * from "./components/CnCharts";

export { CnBadge } from "./components/CnBadge";
export type {
  CnBadgeColor,
  CnBadgeOverlap,
  CnBadgeProps,
  CnBadgeSize,
  CnBadgeVariant,
} from "./components/CnBadge";

export { CnTabs } from "./components/CnTabs";
export type {
  CnTabOption,
  CnTabsColor,
  CnTabsIconPosition,
  CnTabsOrientation,
  CnTabsProps,
  CnTabsSize,
  CnTabsSubtitlePosition,
  CnTabsVariant,
} from "./components/CnTabs";

export {
  CN_FORM_DEFAULT_LABELS,
  CnForm,
  CnFormFieldControl,
  registerFormFieldType,
} from "./components/CnForm";
export type {
  CnDateStringFormat,
  CnFieldOption,
  CnFormActionsAlign,
  CnFormAsyncValidator,
  CnFormButtonColor,
  CnFormButtonProps,
  CnFormCustomElement,
  CnFormCustomRenderProps,
  CnFormDialogWidth,
  CnFormDynamicMessage,
  CnFormDynamicValue,
  CnFormErrorSummary,
  CnFormExtraAction,
  CnFormField,
  CnFormFieldControlProps,
  CnFormFieldRenderer,
  CnFormFieldOrCustom,
  CnFormFieldType,
  CnFormGridProps,
  CnFormGroup,
  CnFormHandle,
  CnFormHelpers,
  CnFormLabels,
  CnFormLoadingStates,
  CnFormMode,
  CnFormProps,
  CnFormSection,
  CnFormSectionContext,
  CnFormSelectOption,
  CnFormSize,
  CnFormStep,
  CnFormSubmitContext,
  CnFormSubmitMode,
  CnFormTab,
  CnFormValidateOn,
  CnFormValues,
  CnFormVariant,
  CnPhoneCountryCode,
  CnPostalCodeFormat,
  CnValidationRule,
  CnValidationRuleCommon,
  CnValidationRuleDefinition,
  BuildFormDataOptions,
  UseFieldValidationOptions,
  UseFieldValidationReturn,
  ValidatorFn,
} from "./components/CnForm";

export {
  buildFormData,
  combineRules,
  expandObject,
  flattenObject,
  getNestedValue,
  getServerErrorMessage,
  hasFiles,
  isDeepEqual,
  isEmptyValue,
  isoToDate,
  normalizeDateValue,
  normalizePath,
  omitPaths,
  parseDateInput,
  parseServerErrors,
  registerValidator,
  setNestedValue,
  useFieldValidation,
  validateFieldValue,
} from "./components/CnForm";

export { CnTextField, CnTextFieldSkeleton } from "./components/CnTextField";
export type {
  CnTextFieldProps,
  CnTextFieldSkeletonProps,
  CnTextFieldSize,
  CnTextFieldSlotProps,
  CnTextFieldTransform,
  CnTextFieldType,
  CnTextFieldVariant,
} from "./components/CnTextField";

export { CnSelectField } from "./components/CnSelectField";
export type { CnSelectFieldProps, CnSelectValue } from "./components/CnSelectField";

export { CnAutocompleteField, normalizeSearchText } from "./components/CnAutocompleteField";
export type {
  CnAutocompleteFieldProps,
  CnAutocompleteValue,
} from "./components/CnAutocompleteField";

export { CnCheckboxField } from "./components/CnCheckboxField";
export type { CnCheckboxFieldProps, CnCheckboxValue } from "./components/CnCheckboxField";

export { CnRadioGroupField } from "./components/CnRadioGroupField";
export type { CnRadioGroupFieldProps, CnRadioValue } from "./components/CnRadioGroupField";

export { CnSwitchField } from "./components/CnSwitchField";
export type { CnSwitchFieldProps } from "./components/CnSwitchField";

export { CnNumberField, CnQuantityField } from "./components/CnNumberField";
export type { CnNumberFieldControls, CnNumberFieldProps } from "./components/CnNumberField";

export { CnCurrencyField, getCurrencySymbol } from "./components/CnCurrencyField";
export type { CnCurrencyFieldProps, CnCurrencySelectorMode } from "./components/CnCurrencyField";

export { CnPhoneField } from "./components/CnPhoneField";
export type { CnPhoneFieldProps, CnPhoneValueFormat } from "./components/CnPhoneField";

export {
  buildDateRangeRules,
  buildDateRangeValueRules,
  CnDateField,
  CnDateRangeField,
  CnTimePanel,
  DEFAULT_DATE_RANGE_PRESETS,
  resolveDateBounds,
  toLocalIsoValue,
} from "./components/CnDateField";
export type {
  CnDateFieldProps,
  CnDateFieldType,
  CnDateRangeFieldProps,
  CnDateRangeOptions,
  CnDateRangePreset,
  CnDateRangeValue,
  CnTimePanelProps,
} from "./components/CnDateField";

export { CnCalendar, isDateDisabled } from "./components/CnCalendar";
export type {
  CnCalendarDisableOptions,
  CnCalendarProps,
  CnCalendarRange,
  CnCalendarView,
} from "./components/CnCalendar";

export { CnSliderField } from "./components/CnSliderField";
export type { CnSliderFieldProps, CnSliderValue } from "./components/CnSliderField";

export { CnRatingField } from "./components/CnRatingField";
export type { CnRatingFieldProps } from "./components/CnRatingField";

export {
  checkImageConstraints,
  CnFileField,
  downloadFile,
  FileLightbox,
  formatDuration,
  getFileKind,
  getSafeUrl,
  isExistingFile,
  isFile,
  isViewableFile,
  matchesAccept,
  readFileMetadata,
} from "./components/CnFileField";
export type {
  CnExistingFile,
  CnFileFieldProps,
  CnFileFieldVariant,
  CnFileSizeUnit,
  CnFileKind,
  CnFileMetadata,
  CnFileRejection,
  CnFileStatus,
  CnFileValue,
  CnImageConstraints,
} from "./components/CnFileField";

export { BUILT_IN_FLAG_CODES, CnFlagIcon } from "./components/CnFlagIcon";
export type { CnFlagIconProps, CnFlagIconVariant } from "./components/CnFlagIcon";

export { CnCountryField, getCountryOptions, ISO_COUNTRY_CODES } from "./components/CnCountryField";
export type { CnCountryFieldProps } from "./components/CnCountryField";

export { CnOtpField } from "./components/CnOtpField";
export type { CnOtpFieldProps } from "./components/CnOtpField";

export { buildMaskRules, CnMaskedField } from "./components/CnMaskedField";
export type { CnMaskedFieldProps } from "./components/CnMaskedField";
export {
  applyMask,
  clabeCheck,
  detectCardBrand,
  luhnCheck,
  MASK_PRESETS,
  maskCapacity,
  unmask,
} from "./utils/mask-utils";
export type { CnCardBrand, CnMaskPreset, CnMaskPresetName } from "./utils/mask-utils";

export { CnTagsField } from "./components/CnTagsField";
export type { CnTagsFieldProps } from "./components/CnTagsField";

export { CnSegmentedField } from "./components/CnSegmentedField";
export type { CnSegmentedFieldProps, CnSegmentedValue } from "./components/CnSegmentedField";

export {
  CnColorField,
  COLOR_RULE,
  DEFAULT_COLOR_PRESETS,
  normalizeHex,
} from "./components/CnColorField";
export type { CnColorFieldProps } from "./components/CnColorField";

export { CnSignatureField } from "./components/CnSignatureField";
export type { CnSignatureFieldProps } from "./components/CnSignatureField";

export {
  buildPasswordRequirements,
  buildPasswordRule,
  CnPasswordField,
  DEFAULT_PASSWORD_REQUIREMENTS,
  generatePassword,
} from "./components/CnPasswordField";
export type {
  CnPasswordFieldProps,
  CnPasswordRequirement,
  CnPasswordRequirementsConfig,
} from "./components/CnPasswordField";

export { CnNumberRangeField, NUMBER_RANGE_RULES } from "./components/CnNumberRangeField";
export type { CnNumberRangeFieldProps, CnNumberRangeValue } from "./components/CnNumberRangeField";

export { CnChoiceCardsField } from "./components/CnChoiceCardsField";
export type {
  CnChoiceCardsFieldProps,
  CnChoiceCardsOption,
  CnChoiceCardsValue,
} from "./components/CnChoiceCardsField";

export { CnTransferListField } from "./components/CnTransferListField";
export type {
  CnTransferListFieldProps,
  CnTransferListValue,
} from "./components/CnTransferListField";

export { CnTreeSelectField } from "./components/CnTreeSelectField";
export type {
  CnTreeOption,
  CnTreeSelectFieldProps,
  CnTreeSelectValue,
} from "./components/CnTreeSelectField";

export { CnKeyValueField, findKeyValueIssues, KEY_VALUE_RULE } from "./components/CnKeyValueField";
export type {
  CnKeyValueFieldProps,
  CnKeyValuePair,
  CnKeyValueValue,
} from "./components/CnKeyValueField";

export {
  CN_CONFIRM_PRESETS,
  CnConfirmDialog,
  CnConfirmProvider,
  useConfirm,
} from "./components/CnConfirmDialog";
export type {
  CnConfirmDialogProps,
  CnConfirmOptions,
  CnConfirmVariant,
} from "./components/CnConfirmDialog";

export { CnToastProvider, describeError, useToast } from "./components/CnToast";
export type {
  CnToastApi,
  CnToastItem,
  CnToastOptions,
  CnToastPosition,
  CnToastProviderProps,
  CnToastSeverity,
} from "./components/CnToast";

export { CnPageContainer } from "./components/CnPageContainer";
export type {
  CnBreadcrumb,
  CnLinkComponentProps,
  CnPageContainerProps,
} from "./components/CnPageContainer";

export { CnMetricCard, CnSparkline } from "./components/CnMetricCard";
export type { CnMetricCardProps, CnMetricColor, CnMetricTrend } from "./components/CnMetricCard";

export {
  CN_STATUS_PRESETS,
  CnCell,
  CnCellDetail,
  CnCellPill,
  CnCopyButton,
  CnDataTable,
  CnEmptyCell,
  CnImageViewer,
  amountInWords,
  colorFromText,
  copyRows,
  formatBytesText,
  numberToSpanishWords,
  rowsToXlsx,
  formatRelative,
  printRows,
  exportRows,
  formatCellText,
  neutralizeFormula,
  renderTypedCell,
  serializeRows,
} from "./components/CnDataTable";
export type {
  CnAggregate,
  CnBulkAction,
  CnCellDetailAction,
  CnCellDetailRow,
  CnCellOptions,
  CnCellProps,
  CnCellTone,
  CnCellType,
  CnColumn,
  CnDataTableProps,
  CnExportColumn,
  CnExportFormat,
  CnRowAction,
  CnServerSide,
  CnSortItem,
  CnStatusOption,
  CnTableQuery,
} from "./components/CnDataTable";

export { CnFormSkeleton } from "./components/CnFormSkeleton";
export type { CnFormSkeletonProps } from "./components/CnFormSkeleton";

export { getInitials, hasOptionMedia, OptionContent, OptionMedia } from "./utils/option-media";

export { resolveFieldState } from "./utils/field-state";
export type { FieldStateInput, FieldStateOutput } from "./utils/field-state";

export { useControllableValue, useFieldControl } from "./utils/field-control";
export type {
  CnFieldBaseProps,
  UseFieldControlOptions,
  UseFieldControlReturn,
} from "./utils/field-control";
export type { CnFieldSize } from "./utils/field-styles";
export { PHONE_COUNTRIES } from "./utils/phone-countries";
export {
  applyDateMask,
  formatIsoForInput,
  isValidIsoValue,
  parseIsoDate,
  parseIsoTime,
  parseMaskedInput,
  toIsoDate,
} from "./utils/date-utils";
export type { CnDateDisplayFormat, CnDateKind, CnWeekday } from "./utils/date-utils";
export { moveArrayItem, useSortableList } from "./utils/use-sortable-list";
export { useAsyncOptions, useOptionMemory } from "./utils/use-async-options";
export type {
  CnLoadOptions,
  CnLoadOptionsContext,
  UseAsyncOptionsParams,
  UseAsyncOptionsReturn,
} from "./utils/use-async-options";
export { usePressRepeat } from "./utils/use-press-repeat";
export type { UseSortableListOptions } from "./utils/use-sortable-list";
export type { CnPhoneCountry } from "./utils/phone-countries";

export { CanekThemeProvider, createCanekTheme } from "./theme";
export type { CanekThemeMode, CanekThemeProviderProps } from "./theme";

export { colors, motion, radii, shadows, spacing, typography, zIndex } from "./tokens";
export type { CnColorScale, CnColorStep, CnRadius, CnShadow, CnSpacing } from "./tokens";

// ─── Skeletons (estado de carga de cada componente) ─────────────────
export { CnAlertSkeleton } from "./components/CnAlert";
export { CnAutocompleteFieldSkeleton } from "./components/CnAutocompleteField";
export { CnAvatarGroupSkeleton, CnAvatarSkeleton } from "./components/CnAvatar";
export { CnBadgeSkeleton } from "./components/CnBadge";
export { CnButtonSkeleton } from "./components/CnButton";
export { CnCalendarSkeleton } from "./components/CnCalendar";
export { CnCardSkeleton } from "./components/CnCard";
export { CnCheckboxFieldSkeleton } from "./components/CnCheckboxField";
export { CnChipSkeleton } from "./components/CnChip";
export { CnChoiceCardsFieldSkeleton } from "./components/CnChoiceCardsField";
export { CnColorFieldSkeleton } from "./components/CnColorField";
export { CnConfirmDialogSkeleton } from "./components/CnConfirmDialog";
export { CnCountryFieldSkeleton } from "./components/CnCountryField";
export { CnCurrencyFieldSkeleton } from "./components/CnCurrencyField";
export { CnDataTableSkeleton } from "./components/CnDataTable";
export { CnDateFieldSkeleton, CnDateRangeFieldSkeleton } from "./components/CnDateField";
export { CnEmptyStateSkeleton } from "./components/CnEmptyState";
export { CnFileFieldSkeleton } from "./components/CnFileField";
export { CnFlagIconSkeleton } from "./components/CnFlagIcon";
export { CnIconSkeleton } from "./components/CnIcon";
export { CnKeyValueFieldSkeleton } from "./components/CnKeyValueField";
export { CnMaskedFieldSkeleton } from "./components/CnMaskedField";
export { CnMetricCardSkeleton } from "./components/CnMetricCard";
export { CnNumberFieldSkeleton } from "./components/CnNumberField";
export { CnNumberRangeFieldSkeleton } from "./components/CnNumberRangeField";
export { CnOtpFieldSkeleton } from "./components/CnOtpField";
export { CnPageContainerSkeleton } from "./components/CnPageContainer";
export { CnPasswordFieldSkeleton } from "./components/CnPasswordField";
export { CnPhoneFieldSkeleton } from "./components/CnPhoneField";
export { CnRadioGroupFieldSkeleton } from "./components/CnRadioGroupField";
export { CnRatingFieldSkeleton } from "./components/CnRatingField";
export { CnRichTextFieldSkeleton } from "./components/CnRichTextField/CnRichTextFieldSkeleton";
export { CnSegmentedFieldSkeleton } from "./components/CnSegmentedField";
export { CnSelectFieldSkeleton } from "./components/CnSelectField";
export { CnSignatureFieldSkeleton } from "./components/CnSignatureField";
export { CnSliderFieldSkeleton } from "./components/CnSliderField";
export { CnSwitchFieldSkeleton } from "./components/CnSwitchField";
export { CnTabsSkeleton } from "./components/CnTabs";
export { CnTagsFieldSkeleton } from "./components/CnTagsField";
export { CnToastSkeleton } from "./components/CnToast";
export { CnTransferListFieldSkeleton } from "./components/CnTransferListField";
export { CnTreeSelectFieldSkeleton } from "./components/CnTreeSelectField";
export type { CnAlertSkeletonProps } from "./components/CnAlert";
export type { CnAutocompleteFieldSkeletonProps } from "./components/CnAutocompleteField";
export type { CnAvatarGroupSkeletonProps, CnAvatarSkeletonProps } from "./components/CnAvatar";
export type { CnBadgeSkeletonProps } from "./components/CnBadge";
export type { CnButtonSkeletonProps } from "./components/CnButton";
export type { CnCalendarSkeletonProps } from "./components/CnCalendar";
export type { CnCardSkeletonProps } from "./components/CnCard";
export type { CnCheckboxFieldSkeletonProps } from "./components/CnCheckboxField";
export type { CnChipSkeletonProps } from "./components/CnChip";
export type { CnChoiceCardsFieldSkeletonProps } from "./components/CnChoiceCardsField";
export type { CnColorFieldSkeletonProps } from "./components/CnColorField";
export type { CnConfirmDialogSkeletonProps } from "./components/CnConfirmDialog";
export type { CnCountryFieldSkeletonProps } from "./components/CnCountryField";
export type { CnCurrencyFieldSkeletonProps } from "./components/CnCurrencyField";
export type { CnDataTableSkeletonColumn, CnDataTableSkeletonProps } from "./components/CnDataTable";
export type {
  CnDateFieldSkeletonProps,
  CnDateRangeFieldSkeletonProps,
} from "./components/CnDateField";
export type { CnEmptyStateSkeletonProps } from "./components/CnEmptyState";
export type { CnFileFieldSkeletonProps } from "./components/CnFileField";
export type { CnFlagIconSkeletonProps } from "./components/CnFlagIcon";
export type { CnFormSkeletonField, CnFormSkeletonSection } from "./components/CnFormSkeleton";
export type { CnIconSkeletonProps } from "./components/CnIcon";
export type { CnKeyValueFieldSkeletonProps } from "./components/CnKeyValueField";
export type { CnMaskedFieldSkeletonProps } from "./components/CnMaskedField";
export type { CnMetricCardSkeletonProps } from "./components/CnMetricCard";
export type { CnNumberFieldSkeletonProps } from "./components/CnNumberField";
export type { CnNumberRangeFieldSkeletonProps } from "./components/CnNumberRangeField";
export type { CnOtpFieldSkeletonProps } from "./components/CnOtpField";
export type {
  CnPageContainerSkeletonContent,
  CnPageContainerSkeletonProps,
} from "./components/CnPageContainer";
export type { CnPasswordFieldSkeletonProps } from "./components/CnPasswordField";
export type { CnPhoneFieldSkeletonProps } from "./components/CnPhoneField";
export type { CnRadioGroupFieldSkeletonProps } from "./components/CnRadioGroupField";
export type { CnRatingFieldSkeletonProps } from "./components/CnRatingField";
export type { CnRichTextFieldSkeletonProps } from "./components/CnRichTextField/CnRichTextFieldSkeleton";
export type { CnSegmentedFieldSkeletonProps } from "./components/CnSegmentedField";
export type { CnSelectFieldSkeletonProps } from "./components/CnSelectField";
export type { CnSignatureFieldSkeletonProps } from "./components/CnSignatureField";
export type { CnSliderFieldSkeletonProps } from "./components/CnSliderField";
export type { CnSwitchFieldSkeletonProps } from "./components/CnSwitchField";
export type { CnTabsSkeletonProps } from "./components/CnTabs";
export type { CnTagsFieldSkeletonProps } from "./components/CnTagsField";
export type { CnToastSkeletonProps } from "./components/CnToast";
export type { CnTransferListFieldSkeletonProps } from "./components/CnTransferListField";
export type { CnTreeSelectFieldSkeletonProps } from "./components/CnTreeSelectField";
