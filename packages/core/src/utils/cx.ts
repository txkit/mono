type CxValue = string | undefined | null | false | Record<string, boolean | undefined>

/** Lightweight className builder. Accepts strings, falsy values, and { class: condition } objects */
export const cx = (...args: CxValue[]): string => {
  const classes: string[] = []

  for (const arg of args) {
    if (!arg) {
      continue
    }
    if (typeof arg === 'string') {
      classes.push(arg)
    } else {
      for (const key of Object.keys(arg)) {
        if (arg[key]) {
          classes.push(key)
        }
      }
    }
  }

  return classes.join(' ')
}
