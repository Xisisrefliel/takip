"use client";

import { useRef, useCallback, useState } from "react";

export function useLongPress(ms = 300) {
  const [isLongPressed, setIsLongPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPressed(true);
    }, ms);
  }, [ms]);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  const dismiss = useCallback(() => {
    setIsLongPressed(false);
    isLongPressRef.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    isLongPressed,
    dismiss,
    handlers: {
      onTouchStart: start,
      onTouchEnd: stop,
      onTouchMove: stop,
      onClick: handleClick,
    },
  };
}
