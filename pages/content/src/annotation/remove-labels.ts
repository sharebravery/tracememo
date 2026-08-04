const DATA_ATTR = 'data-tracememo';

/**
 * Remove every TraceMemo annotation and unwrap address wrappers, restoring the
 * original DOM text. Used when annotations are disabled or the page is reset.
 */
export const removeAnnotations = (root: Document | Element = document): number => {
  const nodes = root.querySelectorAll(`[${DATA_ATTR}]`);
  let removed = 0;

  nodes.forEach(element => {
    if (element.getAttribute(DATA_ATTR) === 'address') {
      // Unwrap: replace the span with its own children (the address text).
      const parent = element.parentNode;
      if (parent) {
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
    } else {
      element.remove();
      removed += 1;
    }
  });

  return removed;
};
