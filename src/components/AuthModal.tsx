// src/components/AuthModal.tsx
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export function AuthModal({ onClose }: { onClose: () => void }) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { signIn, signUp } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('')

        if (!isLogin && password !== confirmPassword) {
            setError("Пароли не совпадают 😎")
            return;
        }

        setIsLoading(true)

        try {
            if (isLogin) {
                await signIn(email, password)
            } else {
                if (password.length < 8) {
                    setError("Пароль должен состоять из 8, а сейчас он: " + password.length)
                    return;
                }
                await signUp(email, password)
            }
            onClose()
        } catch (err: any) {
            setError(err.message || 'Неизвестная ошибка')
        } finally {
            setIsLoading(false)
        }
    };

    const passwordStyle = {
        padding: "10px 40px 10px 12px", background: "#0a0b15", border: "1px solid #2e303a",
        borderRadius: 6, color: "white", fontSize: 14, outline: "none", width: "100%"
    }

    const outerCircleStyle = {
        width: 18, height: 18, border: "2px solid",
        borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center",
    }

    const innerCircleStyle = {
        width: 6, height: 6, borderRadius: "50%"
    }

    const positionCircleStyle = {
        right: 10, top: "50%", transform: "translateY(-50%)",
        cursor: 'pointer', display: "flex", alignItems: "center", justifyContent: "center"
    }

    return (
        <div
            style={{
                position: "fixed", top: 0, right: 0, left: 0, bottom: 0,
                background: "rgba(0, 0, 0, 0.7)", zIndex: 5000,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)"
            }}>
            <div
                style={{
                    background: "rgba(20, 21, 31, 0.98)",
                    padding: 24, borderRadius: 12, border: "1px solid #2e303a",
                    width: "100%", maxWidth: 360, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)"
                }}>
                <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, color: "#e4e4e7", fontSize: 18, fontWeight: 600 }}>
                        {isLogin ? "Вход" : "Регистрация"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}
                    >❌
                    </button>
                </div>

                {error && (
                    <div style={{
                        color: "#ff5f56", fontSize: 15, marginBottom: 12, padding: 10,
                        background: "rgba(255, 96, 86, 0.1)", borderRadius: 6, border: "1px solid rgba(255, 96, 86, 0.3)"
                    }}> {error}
                    </div>
                )}

                <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        style={{
                            padding: "10px 12px", background: "#0a0b15", border: "1px solid #2e303a",
                            borderRadius: 6, color: "white", fontSize: 14, outline: "none"
                        }}
                    />
                    <div style={{ position: "relative", display: "block" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Пароль (мин. символов 8)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={isLoading}
                            style={{...passwordStyle, opacity: isLoading ? 0.7 : 1}}
                        />
                        <span
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                            role="button"
                            tabIndex={0}
                            onClick={() => setShowPassword(!showPassword)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault(); setShowPassword(!showPassword)
                                }
                            }}
                            style={{...positionCircleStyle, position: "absolute"}}>
                            <div
                                style={{
                                    ...outerCircleStyle,
                                    borderColor: showPassword ? "#aa3bff" : "#555"
                                }}
                            >
                                <div style={{
                                    ...innerCircleStyle,
                                    background: showPassword ? "#aa3bff" : "#555",
                                }}
                                />
                            </div>
                        </span>
                    </div>

                    {!isLogin && (
                        <div style={{ position: "relative", display: "block" }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Подтвердите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                disabled={isLoading}
                                style={{...passwordStyle, opacity: isLoading ? 0.7 : 1}}
                            />
                            <span
                                aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                                role="button"
                                tabIndex={0}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault(); setShowConfirmPassword(!showConfirmPassword)
                                    }
                                }}
                                style={{...positionCircleStyle, position: "absolute"}}>
                                <div
                                    style={{
                                        ...outerCircleStyle,
                                        borderColor: showConfirmPassword ? "#aa3bff" : "#555"
                                    }}
                                >
                                    <div style={{
                                        ...innerCircleStyle,
                                        background: showConfirmPassword ? "#aa3bff" : "#555",
                                    }}
                                    />
                                </div>
                            </span>
                        </div>
                    )}
                    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: 12,
                                background: isLoading ? "#7a2bb8" : "#aa3bff",
                                color: "white", border: "none", borderRadius: 6,
                                fontSize: 14, fontWeight: 600, cursor: isLoading ? "wait" : "pointer",
                                marginTop: 8, transition: "background 0.2s",
                            }}>
                            {isLoading ? "Загрузка..." : (isLogin ? "Войти" : "Зарегистрироваться")}
                        </button>
                    </div>
                </form>
                <div
                    style={{
                        marginTop: 16, alignItems: "center", fontSize: 12, color: "#9ca3af", textAlign: "center",
                    }}>
                    {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                    <span
                        onClick={() => { setIsLogin(!isLogin); setError('') }}
                        style={{ color: "#aa3bff", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
                    >{isLogin ? "Создать" : "Войти"}</span>
                </div>
            </div>
        </div>
    )
}