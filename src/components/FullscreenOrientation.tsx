// src/components/FullscreenOrientation.tsx
import { useEffect, useState } from "react";

export function FullscreenOrientation() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };

        const fullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        };

        checkOrientation()
        window.addEventListener("resize", checkOrientation);
        document.addEventListener("fullscreenchange", fullscreenChange)

        return () => {
            window.removeEventListener("resize", checkOrientation);
            document.removeEventListener("fullscreenchange", fullscreenChange)
        }
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (err) {
            console.error("Ошибка полноэкранного режима");
        }
    }

    if (isPortrait) {
        return (
            <div 
                style={{position: "fixed", top: 0, right: 0, left: 0, bottom: 0,
                    background: "rgba(20, 21, 31, 0.98)", zIndex: 6000,
                    display: "flex", flexDirection: "column",
                    alignItems: 'center', justifyContent: "center",
                    padding: 24, color: "white"
                }}>
                    <div style={{fontSize: 64, marginBottom: 24}}>📱</div>
                    <h2 style={{fontSize: 24, marginBottom: 16, textAlign: "center" }}>
                        Поверните устройство
                    </h2>
                    <p 
                        style={{fontSize: 16, color: "#9ca3af", textAlign: "center",
                            marginBottom: 32, maxWidth: 400
                        }}>
                        Сетевые строители: лучше всего работает в горизонтальной ориентации.
                        Пожалуйста переверните устройство горизонтально.
                    </p>
                    <button onClick={toggleFullscreen} 
                        style={{padding: "16px 32px", background: "#aa3bff",
                            color: "white", border: "none", borderRadius: 8,
                            fontSize: 16, fontWeight: 600, cursor: "pointer"
                        }}>
                            { isFullscreen ? "Выйти из полного экрана" : "Полноэкранный режим"}
                    </button>
            </div>
        );
    }

    return (
        <button onClick={toggleFullscreen} title={ isFullscreen ? "Выйти из полного экрана" : "Полноэкранный режим" }
        style={{position: "fixed", top: -4, right: 45, width: 48, height: 48,
            background: "rgba(20, 21, 31, 0.95)", border: "1px solid #2e303a", borderRadius: "50%",
            fontSize: 20, cursor: "pointer", zIndex: 1005, display: "flex", 
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0, 0.3)"
        }}>{isFullscreen ? "❌" : "🗖"}</button>
    )
}