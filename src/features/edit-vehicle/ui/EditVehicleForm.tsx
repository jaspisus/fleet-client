import { revalidateLogic, useForm, useStore, type AnyFieldApi } from '@tanstack/react-form'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Driver } from '@/entities/driver'
import type { Fleet } from '@/entities/fleet'
import {
  isFuelType,
  isVehicleType,
  useVehicleLabels,
  type Vehicle,
  type VehicleDictionaries,
} from '@/entities/vehicle'
import { useFormatters } from '@/shared/i18n'
import { cx } from '@/shared/lib'
import { Alert, Button } from '@/shared/ui'
import { toFormValues, toUpdateCommand, type VehicleFormField } from '../model/formValues'
import { describeSaveError, type TranslatableMessage } from '../model/saveError'
import { useUpdateVehicle } from '../model/useUpdateVehicle'
import {
  NAME_MAX_LENGTH,
  REGISTRATION_NUMBER_MAX_LENGTH,
  validateVehicleForm,
  type FieldError,
  type VehicleFormErrors,
} from '../model/validation'
import { FormSelectControl, FormTextControl, type SelectOption } from './FormControls'
import styles from './EditVehicleForm.module.css'

const fieldId = (name: VehicleFormField) => `vehicle-${name}`

const toOption = ({ id, key }: { id: string; key: string }): SelectOption => ({
  value: id,
  label: key,
})

const withoutField = (errors: VehicleFormErrors, name: string): VehicleFormErrors =>
  Object.fromEntries(Object.entries(errors).filter(([field]) => field !== name))

interface EditVehicleFormProps {
  vehicle: Vehicle
  /** All vehicles, for the unique registration number check. */
  vehicles: readonly Vehicle[]
  dictionaries: VehicleDictionaries
  fleets: readonly Fleet[]
  drivers: readonly Driver[]
  onSaved: (vehicle: Vehicle) => void
  onCancel: () => void
  /** Shows the values locked, without Save and Cancel. */
  readOnly?: boolean
  autoFocus?: boolean
}

export const EditVehicleForm = ({
  vehicle,
  vehicles,
  dictionaries,
  fleets,
  drivers,
  onSaved,
  onCancel,
  readOnly = false,
  autoFocus = false,
}: EditVehicleFormProps) => {
  const { t } = useTranslation()
  const { compare } = useFormatters()
  const labels = useVehicleLabels()
  const { mutate } = useUpdateVehicle(vehicle.id)
  const [serverErrors, setServerErrors] = useState<VehicleFormErrors>({})
  const [formMessage, setFormMessage] = useState<TranslatableMessage | null>(null)

  const validationContext = {
    vehicleId: vehicle.id,
    vehicles,
    dictionaries,
    fleets,
    drivers,
    currentYear: new Date().getFullYear(),
  }

  const form = useForm({
    defaultValues: toFormValues(vehicle),
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: {
      onDynamic: ({ value }) => {
        const errors = validateVehicleForm(value, validationContext)
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined
      },
    },
    listeners: {
      onChange: ({ fieldApi }) =>
        setServerErrors((current) => withoutField(current, fieldApi.name)),
    },
    onSubmit: ({ value }) =>
      new Promise<void>((resolve) => {
        setFormMessage(null)
        setServerErrors({})
        mutate(toUpdateCommand(value), {
          onSuccess: (saved) => {
            resolve()
            onSaved(saved)
          },
          onError: (error) => {
            const { fieldErrors, message } = describeSaveError(error)
            setServerErrors(fieldErrors)
            setFormMessage(message)
            resolve()
          },
        })
      }),
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue)
  const manufacturerId = useStore(form.store, (state) => state.values.manufacturerId)

  const translate = (message: TranslatableMessage) =>
    'key' in message ? t(message.key, message.params) : message.text

  const errorFor = (field: AnyFieldApi): string | undefined => {
    const serverError = serverErrors[field.name as VehicleFormField]
    if (serverError) return translate(serverError)
    const [clientError] = field.state.meta.errors as Array<FieldError | undefined>
    return clientError ? translate(clientError) : undefined
  }

  /** The props every control takes from its field, as plain values. */
  const controlProps = (field: AnyFieldApi) => {
    const name = field.name as VehicleFormField
    return {
      id: fieldId(name),
      label: t(`editVehicle.fields.${name}`),
      value: field.state.value as string,
      error: errorFor(field),
      onChange: (value: string) => field.handleChange(value),
      onBlur: field.handleBlur,
    }
  }

  const byLabel = (a: SelectOption, b: SelectOption) => compare(a.label, b.label)
  const manufacturerOptions = dictionaries.vehicleManufacturer.map(toOption).sort(byLabel)
  const modelOptions = dictionaries.vehicleModels
    .filter((model) => model.manufacturerId === manufacturerId)
    .map(toOption)
    .sort(byLabel)
  const typeOptions = dictionaries.vehicleType.map((type) => ({
    value: type,
    label: labels.vehicleType(type),
  }))
  const fuelOptions = dictionaries.fuelType.map((fuel) => ({
    value: fuel,
    label: labels.fuelType(fuel),
  }))
  const fleetOptions = fleets.map(({ id, name }) => ({ value: id, label: name })).sort(byLabel)
  const driverOptions = [...drivers]
    .sort((a, b) => compare(a.lastName, b.lastName) || compare(a.firstName, b.firstName))
    .map(({ id, name }) => ({ value: id, label: name }))

  const clearModelOfOtherManufacturer = (newManufacturerId: string) => {
    const model = dictionaries.vehicleModels.find(({ id }) => id === form.getFieldValue('modelId'))
    if (model && model.manufacturerId !== newManufacturerId) form.setFieldValue('modelId', '')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.handleSubmit()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <fieldset
        className={cx(styles.fields, readOnly && styles.readOnly)}
        disabled={readOnly || isSubmitting}
      >
        <form.Field name="name">
          {(field) => (
            <FormTextControl
              {...controlProps(field)}
              maxLength={NAME_MAX_LENGTH}
              autoFocus={autoFocus && !readOnly}
            />
          )}
        </form.Field>
        <form.Field name="registrationNumber">
          {(field) => (
            <FormTextControl {...controlProps(field)} maxLength={REGISTRATION_NUMBER_MAX_LENGTH} />
          )}
        </form.Field>
        <form.Field
          name="manufacturerId"
          listeners={{ onChange: ({ value }) => clearModelOfOtherManufacturer(value) }}
        >
          {(field) => (
            <FormSelectControl
              {...controlProps(field)}
              options={manufacturerOptions}
              emptyOption={{ label: t('editVehicle.selectPlaceholder'), selectable: false }}
            />
          )}
        </form.Field>
        <form.Field name="modelId">
          {(field) => (
            <FormSelectControl
              {...controlProps(field)}
              options={modelOptions}
              emptyOption={{
                label: t(
                  manufacturerId === ''
                    ? 'editVehicle.selectManufacturerFirst'
                    : 'editVehicle.selectPlaceholder',
                ),
                selectable: false,
              }}
              disabled={manufacturerId === ''}
            />
          )}
        </form.Field>
        <form.Field name="yearOfManufacture">
          {(field) => (
            <FormTextControl {...controlProps(field)} inputMode="numeric" maxLength={4} />
          )}
        </form.Field>
        <form.Field name="type">
          {(field) => (
            <FormSelectControl
              {...controlProps(field)}
              options={typeOptions}
              onChange={(value) => {
                if (isVehicleType(value)) field.handleChange(value)
              }}
            />
          )}
        </form.Field>
        <form.Field name="fuelType">
          {(field) => (
            <FormSelectControl
              {...controlProps(field)}
              options={fuelOptions}
              onChange={(value) => {
                if (isFuelType(value)) field.handleChange(value)
              }}
            />
          )}
        </form.Field>
        <form.Field name="fleetId">
          {(field) => (
            <FormSelectControl
              {...controlProps(field)}
              options={fleetOptions}
              emptyOption={{ label: t('editVehicle.selectPlaceholder'), selectable: false }}
            />
          )}
        </form.Field>
        <form.Field name="driverId">
          {(field) => (
            <FormSelectControl
              {...controlProps(field)}
              options={driverOptions}
              emptyOption={{ label: t('editVehicle.noDriver'), selectable: true }}
            />
          )}
        </form.Field>
      </fieldset>

      {formMessage && <Alert>{translate(formMessage)}</Alert>}

      {!readOnly && (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || isDefaultValue}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      )}
    </form>
  )
}
