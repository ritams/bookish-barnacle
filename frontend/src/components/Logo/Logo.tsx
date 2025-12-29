import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    linkTo?: string;
    variant?: 'light' | 'dark';
    animate?: boolean;
}

// SVG Logo matching the favicon design
function LogoIcon({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#4a5d23', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#3a4a1c', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#e8f0d0', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Background rounded square */}
            <rect x="4" y="4" width="56" height="56" rx="12" ry="12" fill="url(#bgGrad)" />
            {/* Decorative accent */}
            <rect x="4" y="4" width="56" height="56" rx="12" ry="12" fill="none" stroke="#6b8b3a" strokeWidth="1" opacity="0.5" />
            {/* LaTeX-inspired design: Stylized "L" with integral symbol aesthetic */}
            <path d="M18 16 L18 44 L32 44" stroke="url(#textGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Math formula dots representing typesetting */}
            <circle cx="42" cy="20" r="3" fill="#8fa84a" />
            <circle cx="48" cy="28" r="2.5" fill="#a8c05e" />
            <circle cx="44" cy="36" r="2" fill="#c4d890" />
            {/* Sigma-like symbol simplified */}
            <path d="M38 46 L50 46 L44 52 L50 58 L38 58" stroke="url(#textGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}

const sizeConfig = {
    sm: { icon: '1.5rem', text: '1rem', gap: '0.375rem' },
    md: { icon: '2.25rem', text: '1.25rem', gap: '0.625rem' },
    lg: { icon: '2.75rem', text: '1.5rem', gap: '0.75rem' }
};

export function Logo({
    size = 'md',
    showText = true,
    linkTo,
    variant = 'light',
    animate = true
}: LogoProps) {
    const config = sizeConfig[size];
    const textColor = variant === 'light' ? { primary: '#3a3f2c', secondary: '#687549' } : { primary: '#ffffff', secondary: '#c2ccab' };

    const logoContent = (
        <>
            {animate ? (
                <motion.div
                    style={{
                        width: config.icon,
                        height: config.icon,
                        flexShrink: 0
                    }}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <LogoIcon style={{ width: '100%', height: '100%' }} />
                </motion.div>
            ) : (
                <div style={{ width: config.icon, height: config.icon, flexShrink: 0 }}>
                    <LogoIcon style={{ width: '100%', height: '100%' }} />
                </div>
            )}
            {showText && (
                <span style={{ fontSize: config.text, fontWeight: 700 }}>
                    <span style={{ color: textColor.primary }}>LaTeX</span>
                    <span style={{ color: textColor.secondary }}>Studio</span>
                </span>
            )}
        </>
    );

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: config.gap,
        textDecoration: 'none'
    };

    if (linkTo) {
        return (
            <Link to={linkTo} style={containerStyle}>
                {logoContent}
            </Link>
        );
    }

    return (
        <div style={containerStyle}>
            {logoContent}
        </div>
    );
}

// Export the standalone icon for use in places where only the icon is needed
export { LogoIcon };
