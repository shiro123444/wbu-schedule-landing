/**
 * AnimatedList – adapted from Magic UI's animated-list component.
 * Progressively reveals list items from top with smooth enter animations.
 * Uses framer-motion for reliable mount animations.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export function AnimatedList({
    children,
    className = "",
    delay = 1000,
}) {
    const childrenArray = useMemo(
        () => Array.isArray(children) ? children : [children],
        [children]
    );

    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index >= childrenArray.length) return;

        const timeout = setTimeout(() => {
            setIndex((prev) => prev + 1);
        }, delay);

        return () => clearTimeout(timeout);
    }, [index, delay, childrenArray.length]);

    const itemsToShow = useMemo(
        () => childrenArray.slice(0, index + 1).reverse(),
        [index, childrenArray]
    );

    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            <AnimatePresence>
                {itemsToShow.map((item, i) => (
                    <AnimatedListItem key={item.key || i}>
                        {item}
                    </AnimatedListItem>
                ))}
            </AnimatePresence>
        </div>
    );
}

function AnimatedListItem({ children }) {
    const animations = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, originY: 0 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: "spring", stiffness: 350, damping: 40 },
    };

    return (
        <motion.div {...animations} layout className="mx-auto w-full">
            {children}
        </motion.div>
    );
}
