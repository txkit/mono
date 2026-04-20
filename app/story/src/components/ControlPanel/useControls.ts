import { useState, useCallback } from 'react'


type ControlDescription = {
  /** Optional human-readable hint shown under the control label */
  description?: string
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

export type ControlDef = BooleanControl | StringControl | NumberControl | SelectControl | StateMachineControl

export type ControlSchema = Record<string, ControlDef>

type ResolvedValues<T extends ControlSchema> = {
  [K in keyof T]: T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'number'
      ? number
      : string
}

export type ControlEntry = {
  key: string
  def: ControlDef
  value: boolean | string | number
  setValue: (value: boolean | string | number) => void
}

type UseControlsReturn<T extends ControlSchema> = {
  values: ResolvedValues<T>
  entries: ControlEntry[]
  isDefault: boolean
  reset: () => void
}

const getDefaults = <T extends ControlSchema>(schema: T): Record<string, boolean | string | number> => {
  const defaults: Record<string, boolean | string | number> = {}
  for (const key of Object.keys(schema)) {
    defaults[key] = schema[key].default
  }
  return defaults
}

const useControls = <T extends ControlSchema>(schema: T): UseControlsReturn<T> => {
  const [ values, setValues ] = useState<Record<string, boolean | string | number>>(() => getDefaults(schema))

  const setValue = useCallback((key: string, value: boolean | string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setValues(getDefaults(schema))
  }, [ schema ])

  const entries: ControlEntry[] = Object.keys(schema).map((key) => ({
    key,
    def: schema[key],
    value: values[key],
    setValue: (v: boolean | string | number) => setValue(key, v),
  }))

  const isDefault = Object.keys(schema).every((key) => values[key] === schema[key].default)

  return {
    values: values as ResolvedValues<T>,
    entries,
    isDefault,
    reset,
  }
}


export default useControls
