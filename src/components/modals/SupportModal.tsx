// src/components/SupportModal.tsx
export function SupportModal({ onClose }: { onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', zIndex: 5000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'rgba(20, 21, 31, 0.98)',
                padding: 24, borderRadius: 12, border: '1px solid #2e303a',
                width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0, color: '#e4e4e7', fontSize: 18, fontWeight: 600 }}>
                        💝 Поддержка проекта, для дальнейшего прогресса
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>❌</button>
                </div>

                <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                    GridBuilders — open-source проект под AGPL-3.0, развивается на энтузиазме.
                    Как вы можете поддержать проект:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <SupportLink href="https://github.com/Maksim2021-whiteHAKER/gridBuilders" emoji="⭐" title="Поставить звёздку на GitHub" desc="Бесплатно, помогает продвижению" />
                    <SupportLink href="https://boosty.to/ghostwarriorxz/donate" emoji="💰" title="Boosty" desc="Разовая или ежемесячная поддержка" />
                    <SupportLink href="https://www.donationalerts.com/r/ghostwarriorxz" emoji="💎" title="DonationAlerts" desc="Разовая поддержка" />
                    <SupportLink href="https://yoomoney.ru/to/410015336126322" emoji="💳" title="YooMoney" desc="Прямой перевод" />
                    <SupportLink href="" emoji="🌐💳❌ пока в работе" title="WebMoney" desc="электронный кошелёк" />
                    <SupportLink href="https://github.com/Maksim2021-whiteHAKER/gridBuilders/issues" emoji="🐛" title="Issues на GitHub" desc="Сообщить об ошибках или предложить идеи" />
                </div>

                <div style={{ marginTop: 20, padding: 16, background: 'rgba(170, 59, 255, 0.1)', borderRadius: 8, border: '1px solid rgba(170, 59, 255, 0.3)' }}>
                    <p style={{ color: '#e4e4e7', fontSize: 13, margin: 0, textAlign: 'center' }}>
                        📢 Рассказать друзьям о GridBuilders!
                    </p>
                </div>

                <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
                    Спасибо за использование GridBuilders! Любая поддержка мотивирует на развитие проекта дальше. 🙏
                </p>
            </div>
        </div>
    );
}

function SupportLink({ href, emoji, title, desc }: { href: string; emoji: string; title: string; desc: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: '#14151f',
            border: '1px solid #2e303a', borderRadius: 8,
            textDecoration: 'none', color: '#e4e4e7',
            cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#aa3bff'; e.currentTarget.style.background = 'rgba(170, 59, 255, 0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e303a'; e.currentTarget.style.background = '#14151f'; }}
        >
            <span style={{ fontSize: 20 }}>{emoji}</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{desc}</div>
            </div>
        </a>
    );
}