const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'A', 'P', 'DIV', 'BR'])

export function sanitizeRichText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  walkAndSanitize(doc.body)

  return doc.body.innerHTML
}

export function sanitizeLink(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const prefixed = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(prefixed)
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

export function htmlToText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent?.trim() ?? ''
}

function walkAndSanitize(root: HTMLElement): void {
  const nodes = Array.from(root.querySelectorAll('*'))

  for (const node of nodes) {
    if (!ALLOWED_TAGS.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes))
      continue
    }

    for (const attr of Array.from(node.attributes)) {
      if (node.tagName !== 'A' || attr.name !== 'href') {
        node.removeAttribute(attr.name)
      }
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href')
      const safeHref = href ? sanitizeLink(href) : null
      if (safeHref) {
        node.setAttribute('href', safeHref)
        node.setAttribute('rel', 'noopener noreferrer')
        node.setAttribute('target', '_blank')
      } else {
        node.replaceWith(...Array.from(node.childNodes))
      }
    }
  }
}
