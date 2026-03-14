export function trapFocus(node: HTMLElement) {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const focusableElements = Array.from(
      node.querySelectorAll(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && (el as HTMLElement).offsetParent !== null) as HTMLElement[];
    if (focusableElements.length === 0) return;
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex =
      (currentIndex + (event.shiftKey ? -1 : 1) + focusableElements.length) %
      focusableElements.length;
    focusableElements[nextIndex]?.focus();
  };
  node.addEventListener('keydown', handleKeydown);
  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown);
    },
  };
}
