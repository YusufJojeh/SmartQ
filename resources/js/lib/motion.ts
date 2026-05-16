import type { HTMLMotionProps, Variants } from 'framer-motion';

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

export const staggerContainer: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.04,
        },
    },
};

export function motionProps(): HTMLMotionProps<'div'> {
    return {
        variants: fadeUp,
    };
}
