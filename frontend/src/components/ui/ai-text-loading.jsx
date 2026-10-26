"use client";

/**
 * @author: @kokonutui
 * @description: AI Text Loading - Fast & Responsive
 * @version: 1.1.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export default function AITextLoading({
  texts = [
    "Thinking...",
    "Analyzing...",
    "Responding...",
  ],
  className,
  interval = 1400,
}) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  return (
    <div className="flex items-center justify-center py-0.5 px-1">
      <AnimatePresence mode="instant">
        <motion.div
          key={currentTextIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "text-xs font-medium text-slate-600 select-none",
            className
          )}
        >
          {texts[currentTextIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
