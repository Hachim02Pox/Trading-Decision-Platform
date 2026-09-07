"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

/**
 * Milestone 1E, section 12 — small hand-rolled focus trap + open/close
 * ergonomics for the drawer: moves focus into the container on mount, traps
 * Tab/Shift+Tab cycling within its focusable elements, and restores focus
 * to whatever triggered the open when the trap unmounts/closes. Deliberately
 * no new dependency — the trap logic is a few lines of DOM query + keydown
 * handling.
 */
export function useFocusTrap(active: boolean): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (container) {
      const focusable = getFocusable(container);
      (focusable[0] ?? container).focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !container.contains(current)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerElementRef.current?.focus();
    };
  }, [active]);

  return containerRef;
}
