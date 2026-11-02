/** One named frame per page. A repeated film must not share the name twice. */
export function armFilmFrame(frame: HTMLElement, name: string): void {
  for (const other of document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')) {
    if (other !== frame) {
      other.style.viewTransitionName = '';
    }
  }
  frame.style.viewTransitionName = name;
}
