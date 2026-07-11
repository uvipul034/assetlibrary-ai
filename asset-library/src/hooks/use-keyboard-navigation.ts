import { useEffect } from "react";

/**
 * A simple hook to navigate a grid of elements using arrow keys.
 * Expects elements to have a specific data-attribute for indexing.
 */
export function useKeyboardNavigation(
  itemCount: number,
  columns: number,
  onEnter: (index: number) => void,
  onEscape: () => void
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Find currently focused element index
      const activeEl = document.activeElement as HTMLElement;
      let currentIndex = -1;
      
      if (activeEl && activeEl.hasAttribute("data-grid-index")) {
        currentIndex = parseInt(activeEl.getAttribute("data-grid-index") || "-1", 10);
      }

      switch (e.key) {
        case "ArrowRight":
          if (currentIndex < itemCount - 1) focusItem(currentIndex + 1);
          break;
        case "ArrowLeft":
          if (currentIndex > 0) focusItem(currentIndex - 1);
          break;
        case "ArrowDown":
          if (currentIndex + columns < itemCount) focusItem(currentIndex + columns);
          break;
        case "ArrowUp":
          if (currentIndex - columns >= 0) focusItem(currentIndex - columns);
          break;
        case "Enter":
          if (currentIndex >= 0) onEnter(currentIndex);
          break;
        case "Escape":
          onEscape();
          break;
      }
    }

    function focusItem(index: number) {
      const el = document.querySelector(`[data-grid-index="${index}"]`) as HTMLElement;
      if (el) el.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemCount, columns, onEnter, onEscape]);
}
