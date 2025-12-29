import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Logo } from '../../components/Logo';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
};

export function AuthPage() {
    const location = useLocation();
    const isLogin = location.pathname === '/login';
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const { login, register, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let success = false;
        if (isLogin) {
            success = await login(email, password);
        } else {
            success = await register(email, password, name);
        }

        if (success) {
            navigate('/projects');
        }
    };

    const switchMode = () => {
        clearError();
        navigate(isLogin ? '/signup' : '/login');
    };

    // Input styles with proper padding
    const inputStyle: React.CSSProperties = {
        width: '100%',
        paddingLeft: '3rem',
        paddingRight: '1rem',
        paddingTop: '0.875rem',
        paddingBottom: '0.875rem',
        backgroundColor: 'rgba(248, 249, 244, 0.5)',
        border: '1px solid #dce3ce',
        borderRadius: '0.75rem',
        color: '#3a3f2c',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s',
    };

    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        transition: 'color 0.2s',
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8f9f4 0%, #fff 50%, #eef1e6 100%)' }}>
            {/* Left Panel - Branding */}
            <div
                className="hidden lg:flex"
                style={{
                    width: '50%',
                    background: 'linear-gradient(135deg, #525c3a 0%, #525c3a 50%, #434a31 100%)',
                    padding: '3rem',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Animated background */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '5rem',
                            left: '2.5rem',
                            width: '18rem',
                            height: '18rem',
                            background: 'rgba(104, 117, 73, 0.3)',
                            borderRadius: '50%',
                            filter: 'blur(48px)'
                        }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '5rem',
                            right: '2.5rem',
                            width: '24rem',
                            height: '24rem',
                            background: 'rgba(132, 147, 98, 0.2)',
                            borderRadius: '50%',
                            filter: 'blur(48px)'
                        }}
                        animate={{ scale: [1, 0.9, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                </div>

                <motion.div
                    style={{ position: 'relative', zIndex: 10 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Logo size="lg" linkTo="/" variant="dark" animate={true} />
                </motion.div>

                <motion.div
                    style={{ position: 'relative', zIndex: 10 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? 'login' : 'signup'}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', marginBottom: '1rem', lineHeight: 1.2 }}>
                                {isLogin ? 'Welcome back!' : 'Start your journey'}
                            </h2>
                            <p style={{ color: '#c2ccab', fontSize: '1.125rem', lineHeight: 1.6, maxWidth: '28rem' }}>
                                {isLogin
                                    ? 'Sign in to continue working on your LaTeX documents and access all your projects.'
                                    : 'Create an account to start writing beautiful LaTeX documents in the cloud.'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Feature highlights */}
                    <motion.div
                        style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {['Real-time PDF preview', 'Cloud sync across devices', 'Free forever'].map((feature, i) => (
                            <motion.div
                                key={feature}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c2ccab' }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                            >
                                <Sparkles size={16} color="#a3b082" />
                                <span>{feature}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                <motion.div
                    style={{ position: 'relative', zIndex: 10, color: '#a3b082', fontSize: '0.875rem' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    © 2024 LaTeX Studio
                </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
                {/* Floating background */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '5rem',
                            left: '2.5rem',
                            width: '18rem',
                            height: '18rem',
                            background: 'rgba(104, 117, 73, 0.2)',
                            borderRadius: '50%',
                            filter: 'blur(48px)'
                        }}
                        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '5rem',
                            right: '2.5rem',
                            width: '24rem',
                            height: '24rem',
                            background: 'rgba(132, 147, 98, 0.15)',
                            borderRadius: '50%',
                            filter: 'blur(48px)'
                        }}
                        animate={{ y: [0, 30, 0], x: [0, -15, 0], scale: [1, 0.9, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Auth Card */}
                <motion.div
                    style={{ width: '100%', maxWidth: '28rem', position: 'relative', zIndex: 10 }}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Mobile Logo */}
                    <motion.div
                        className="lg:hidden"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}
                        variants={fadeInUp}
                    >
                        <Logo size="md" variant="light" animate={false} />
                    </motion.div>

                    <motion.div
                        style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(20px)',
                            padding: '2.5rem',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(220, 227, 206, 0.5)',
                            boxShadow: '0 25px 50px -12px rgba(82, 92, 58, 0.15)'
                        }}
                        variants={scaleIn}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Header */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? 'login-header' : 'signup-header'}
                                style={{ textAlign: 'center', marginBottom: '2rem' }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3a3f2c', marginBottom: '0.5rem' }}>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                </h1>
                                <p style={{ color: '#849362', fontSize: '0.875rem' }}>
                                    {isLogin
                                        ? 'Enter your credentials to continue'
                                        : 'Fill in your details to get started'}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <AnimatePresence mode="wait">
                                {!isLogin && (
                                    <motion.div
                                        key="name-field"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#525c3a', marginBottom: '0.5rem' }}>
                                            Full Name
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <User
                                                size={18}
                                                style={{ ...iconStyle, color: focusedField === 'name' ? '#687549' : '#a3b082' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                required={!isLogin}
                                                style={inputStyle}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div variants={fadeInUp}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#525c3a', marginBottom: '0.5rem' }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail
                                        size={18}
                                        style={{ ...iconStyle, color: focusedField === 'email' ? '#687549' : '#a3b082' }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={inputStyle}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={fadeInUp}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#525c3a', marginBottom: '0.5rem' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock
                                        size={18}
                                        style={{ ...iconStyle, color: focusedField === 'password' ? '#687549' : '#a3b082' }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        minLength={8}
                                        style={inputStyle}
                                    />
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        style={{
                                            padding: '1rem',
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '0.75rem',
                                            color: '#dc2626',
                                            fontSize: '0.875rem'
                                        }}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    marginTop: '0.5rem',
                                    background: '#525c3a',
                                    color: 'white',
                                    borderRadius: '0.75rem',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.5 : 1,
                                    boxShadow: '0 10px 15px -3px rgba(82, 92, 58, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                                disabled={isLoading}
                                variants={fadeInUp}
                                whileHover={{ scale: 1.01, background: '#434a31' }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Please wait...</span>
                                    </>
                                ) : (
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                )}
                            </motion.button>
                        </form>

                        {/* Switch Mode */}
                        <motion.div
                            style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eef1e6', textAlign: 'center' }}
                            variants={fadeInUp}
                        >
                            <p style={{ color: '#849362', fontSize: '0.875rem' }}>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                                <button
                                    onClick={switchMode}
                                    style={{
                                        color: '#525c3a',
                                        fontWeight: 600,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Back to home - Desktop */}
                    <motion.div
                        className="hidden lg:block"
                        style={{ marginTop: '1.5rem', textAlign: 'center' }}
                        variants={fadeInUp}
                    >
                        <Link
                            to="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#849362',
                                fontSize: '0.875rem',
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Home</span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
