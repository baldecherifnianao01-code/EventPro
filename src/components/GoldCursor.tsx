import { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'interactive' | 'media';

function detectCursorMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return 'default';

  // Keep text inputs and textareas calm for clean typing focus
  if (
    target.closest(
      'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea'
    )
  ) {
    return 'default';
  }

  // Direct image element or explicit media wrapper
  if (target.tagName === 'IMG' || target.closest('[data-cursor="media"]')) {
    return 'media';
  }

  // Interactive controls (buttons, links, tabs, map pins, sliders)
  const interactive = target.closest(
    'button, a, [role="button"], [role="slider"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, summary, label.cursor-pointer'
  );
  if (interactive) {
    const hasLargeImage =
      Boolean(interactive.querySelector('img')) &&
      interactive.getBoundingClientRect().height >= 120;
    return hasLargeImage ? 'media' : 'interactive';
  }

  // Overlay scrim resting directly over a sibling image (e.g. Hero, Venues, Before/After)
  if (target.parentElement?.querySelector(':scope > img')) {
    return 'media';
  }

  return 'default';
}

export function GoldCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [pressed, setPressed] = useState(false);

  const ringRef = useRef<HTMLDivElement | null>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const hasMoved = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      const desktopPointer = pointerQuery.matches && window.innerWidth >= 768;
      const allowMotion = !motionQuery.matches;
      setEnabled(desktopPointer && allowMotion);
    };

    evaluate();
    pointerQuery.addEventListener('change', evaluate);
    motionQuery.addEventListener('change', evaluate);
    window.addEventListener('resize', evaluate);

    return () => {
      pointerQuery.removeEventListener('change', evaluate);
      motionQuery.removeEventListener('change', evaluate);
      window.removeEventListener('resize', evaluate);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      hasMoved.current = false;
      return;
    }

    let rafId = 0;

    const tick = () => {
      const el = ringRef.current;
      if (el) {
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.24;
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.24;
        el.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setVisible(false);
        return;
      }

      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      if (!hasMoved.current) {
        currentPos.current.x = e.clientX;
        currentPos.current.y = e.clientY;
        hasMoved.current = true;
      }

      setVisible(true);
      const nextMode = detectCursorMode(e.target);
      setMode((prev) => (prev === nextMode ? prev : nextMode));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setVisible(false);
        return;
      }
      setPressed(true);
    };

    const onPointerUp = () => setPressed(false);
    const onPointerLeave = () => setVisible(false);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const sizePx = mode === 'media' ? 56 : mode === 'interactive' ? 44 : 26;
  const pressScale = pressed ? 0.88 : 1;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="gold-cursor-layer fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 180ms ease-out',
      }}
    >
      <div
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          transform: `translate(-50%, -50%) scale(${pressScale})`,
          transition:
            'width 200ms cubic-bezier(0.16, 1, 0.3, 1), height 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 140ms ease-out, background-color 200ms ease-out, border-color 200ms ease-out',
          backgroundColor:
            mode === 'media'
              ? 'rgba(212, 175, 55, 0.14)'
              : mode === 'interactive'
                ? 'rgba(197, 155, 39, 0.12)'
                : 'rgba(197, 155, 39, 0.05)',
          borderColor:
            mode === 'media'
              ? 'rgba(229, 198, 101, 0.92)'
              : mode === 'interactive'
                ? 'rgba(212, 175, 55, 0.9)'
                : 'rgba(197, 155, 39, 0.72)',
          boxShadow:
            mode === 'default'
              ? '0 0 0 1px rgba(10, 10, 11, 0.14)'
              : '0 0 18px rgba(197, 155, 39, 0.24)',
        }}
        className="rounded-full border-[1.5px]"
      />
    </div>
  );
}
