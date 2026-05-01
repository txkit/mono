import { useState, useCallback } from 'react'

import { ICON_SOURCE_DEFAULT, isIconSourceDefault, isIconSourceValue } from '../../helpers/iconSources'
import type { IconSourceValue } from '../../helpers/iconSources'


type ControlDescription = {
  /** Optional human-readable hint shown under the control label */
  description?: string
  /** When true, the control spans the full row in the toggles grid (both columns). */
  fullWidth?: boolean
}

type BooleanControl = ControlDescription & {
  type: 'boolean'
  default: boolean
}

type StringControl = ControlDescription & {
  type: 'string'
  default: string
}

type NumberControl = ControlDescription & {
  type: 'number'
  default: number
  min?: number
  max?: number
  step?: number
}

type SelectControl = ControlDescription & {
  type: 'select'
  default: string
  options: string[]
}

type StateNode = {
  id: string
  label: string
  color: string
}

type StateMachineControl = ControlDescription & {
  type: 'state'
  default: string
  states: readonly StateNode[]
}

type IconSourceControl = ControlDescription & {
  type: 'icon-source'
  default?: IconSourceValue
  /** Resolved token address (empty string for native ETH) used for live URL preview */
  tokenAddress: string
  /** Token symbol used as fallback letter when no icon resolves */
  tokenSymbol: string
}

export type ControlValue = boolean | string | number | IconSourceValue

export type ControlDef = BooleanControl | StringControl | NumberControl | SelectControl | StateMachineControl | IconSourceControl

export type ControlSchema = Record<string, ControlDef>

type ResolvedValues<T extends ControlSchema> = {
  [K in keyof T]: T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'number'
      ? number
      : T[K]['type'] extends 'icon-source'
        ? IconSourceValue
        : string
}

export type ControlEntry = {
  key: string
  def: ControlDef
  value: ControlValue
  setValue: (value: ControlValue) => void
}

type UseControlsReturn<T extends ControlSchema> = {
  values: ResolvedValues<T>
  entries: ControlEntry[]
  isDefault: boolean
  reset: () => void
}

const resolveDefault = (def: ControlDef): ControlValue => {
  if (def.type === 'icon-source') {
    return def.default ?? ICON_SOURCE_DEFAULT
  }
  return def.default
}

const getDefaults = <T extends ControlSchema>(schema: T): Record<string, ControlValue> => {
  const defaults: Record<string, ControlValue> = {}
  for (const key of Object.keys(schema)) {
    defaults[key] = resolveDefault(schema[key])
  }
  return defaults
}

const isValueAtDefault = (def: ControlDef, value: ControlValue): boolean => {
  if (def.type === 'icon-source') {
    return isIconSourceValue(value) && isIconSourceDefault(value)
  }
  return value === def.default
}

const useControls = <T extends ControlSchema>(schema: T): UseControlsReturn<T> => {
  const [ values, setValues ] = useState<Record<string, ControlValue>>(() => getDefaults(schema))

  const setValue = useCallback((key: string, value: ControlValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setValues((prev) => {
      const next = getDefaults(schema)
      for (const key of Object.keys(schema)) {
        if (schema[key].type === 'state') {
          next[key] = prev[key]
        }
      }
      return next
    })
  }, [ schema ])

  const entries: ControlEntry[] = Object.keys(schema).map((key) => ({
    key,
    def: schema[key],
    value: values[key],
    setValue: (v: ControlValue) => setValue(key, v),
  }))

  const isDefault = Object.keys(schema).every((key) => {
    if (schema[key].type === 'state') {
      return true
    }
    return isValueAtDefault(schema[key], values[key])
  })

  return {
    values: values as ResolvedValues<T>,
    entries,
    isDefault,
    reset,
  }
}


export default useControls
