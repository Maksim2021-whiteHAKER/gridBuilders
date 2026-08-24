// scr/hooks/useIsMobile.ts
import {useState, useEffect} from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType() {
    const [ deviceType, setDeviceType ] = useState<DeviceType>('desktop')

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setDeviceType('mobile');
            } else if (width < 1024) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
        };

        checkDevice()
        window.addEventListener('resize', checkDevice);
        return () => removeEventListener('resize', checkDevice);
    }, [])
    return deviceType;
}

export const useIsMobile = () => useDeviceType() === 'mobile';
export const useIsTablet = () => useDeviceType() === 'tablet';
export const useIsDesktop = () => useDeviceType() === 'desktop';
