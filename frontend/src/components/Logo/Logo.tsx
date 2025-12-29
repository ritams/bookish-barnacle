import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    linkTo?: string;
    variant?: 'light' | 'dark';
    animate?: boolean;
}

// SVG Logo - Winter Archive design with snowflake accent
function LogoIcon({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#334155', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="logoSnowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#e2e8f0', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Background rounded square */}
            <rect x="4" y="4" width="56" height="56" rx="12" ry="12" fill="url(#logoBgGrad)" />
            {/* Subtle border accent */}
            <rect x="4" y="4" width="56" height="56" rx="12" ry="12" fill="none" stroke="#475569" strokeWidth="1" opacity="0.5" />
            {/* Document base */}
            <rect x="18" y="14" width="28" height="36" rx="3" fill="url(#logoSnowGrad)" opacity="0.95" />
            <rect x="18" y="14" width="28" height="36" rx="3" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            {/* Document lines */}
            <line x1="23" y1="24" x2="41" y2="24" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="32" x2="37" y2="32" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="40" x2="39" y2="40" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            {/* Snowflake accent (top right) */}
            <g transform="translate(44, 12)">
                <circle cx="0" cy="0" r="8" fill="url(#logoAccentGrad)" opacity="0.9" />
                {/* Snowflake arms */}
                <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
                <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
            </g>
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
    const textColor = variant === 'light'
        ? { primary: '#1e293b', secondary: '#06b6d4' }
        : { primary: '#ffffff', secondary: '#22d3ee' };

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
                    <span style={{ color: textColor.primary }}>Winter</span>
                    <span style={{ color: textColor.secondary }}>Archive</span>
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
