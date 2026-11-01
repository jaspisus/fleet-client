import type { ComponentProps } from 'react'
import { Field, fieldErrorId, Select, TextInput } from '@/shared/ui'

// Controls receive plain values rather than the TanStack Form field object: the field API is a
// mutable instance, which the React Compiler cannot see change.

interface FormControlProps {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled?: boolean
}

type FormTextControlProps = FormControlProps &
  Pick<ComponentProps<'input'>, 'inputMode' | 'autoComplete' | 'maxLength' | 'autoFocus'>

export const FormTextControl = ({
  id,
  label,
  value,
  error,
  onChange,
  onBlur,
  disabled,
  inputMode,
  autoComplete = 'off',
  maxLength,
  autoFocus,
}: FormTextControlProps) => (
  <Field id={id} label={label} error={error}>
    <TextInput
      id={id}
      name={id}
      value={value}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      autoFocus={autoFocus}
      disabled={disabled}
      invalid={error !== undefined}
      aria-describedby={error ? fieldErrorId(id) : undefined}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  </Field>
)

export interface SelectOption {
  value: string
  label: string
}

type FormSelectControlProps = FormControlProps & {
  options: readonly SelectOption[]
  /** First option with an empty value, e.g. "Select…" or "No driver". */
  emptyOption?: { label: string; selectable: boolean }
}

export const FormSelectControl = ({
  id,
  label,
  value,
  error,
  onChange,
  onBlur,
  disabled,
  options,
  emptyOption,
}: FormSelectControlProps) => (
  <Field id={id} label={label} error={error}>
    <Select
      id={id}
      name={id}
      value={value}
      disabled={disabled}
      invalid={error !== undefined}
      aria-describedby={error ? fieldErrorId(id) : undefined}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    >
      {emptyOption && (
        <option value="" disabled={!emptyOption.selectable}>
          {emptyOption.label}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  </Field>
)
