/**
 * Copy text to clipboard with fallback for insecure contexts.
 * Primary: navigator.clipboard.writeText (requires Secure Context).
 * Fallback: hidden textarea + document.execCommand('copy').
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  // Modern Clipboard API (HTTPS / localhost only)
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      // May fail even when API exists (e.g. iframe without permission)
    }
  }

  // Fallback: hidden textarea + execCommand
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'

    document.body.appendChild(textarea)
    textarea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textarea)

    return success
  }
  catch {
    return false
  }
}


export default copyToClipboard
