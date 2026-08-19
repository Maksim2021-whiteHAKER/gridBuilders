// scr/hooks/useIsMobile.ts
import {useState, useEffect} from 'react'

export function useIsMobile(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        const resize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', resize);
        return () => removeEventListener('resize', resize);
    }, [breakpoint])
    return isMobile;
}