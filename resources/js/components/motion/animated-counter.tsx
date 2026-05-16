import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
    value: number;
    suffix?: string;
    className?: string;
    duration?: number;
}

export function AnimatedCounter({ value, suffix = '', className, duration = 1.2 }: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-10%' });
    const mv = useMotionValue(0);
    const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        if (inView) mv.set(value);
    }, [inView, value, mv]);

    useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v).toLocaleString())), [spring]);

    return (
        <span ref={ref} className={cn('tabular', className)}>
            {display}{suffix}
        </span>
    );
}
