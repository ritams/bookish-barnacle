import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../stores/authStore';
import { Logo } from '../../components/Logo';

export function AuthPage() {
    const navigate = useNavigate();
    const { googleLogin, isLoading, error } = useAuthStore();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (credentialResponse.credential) {
            const success = await googleLogin(credentialResponse.credential);
            if (success) {
                navigate('/projects');
            }
        }
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
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', marginBottom: '1rem', lineHeight: 1.2 }}>
                        Start your journey
                    </h2>
                    <p style={{ color: '#c2ccab', fontSize: '1.125rem', lineHeight: 1.6, maxWidth: '28rem' }}>
                        Sign in to continue working on your LaTeX documents and access all your projects.
                    </p>

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
                {/* Auth Card */}
                <motion.div
                    style={{ width: '100%', maxWidth: '28rem', position: 'relative', zIndex: 10 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {/* Mobile Logo */}
                    <motion.div
                        className="lg:hidden"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}
                    >
                        <Logo size="md" variant="light" animate={false} />
                    </motion.div>

                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(20px)',
                            padding: '2.5rem',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(220, 227, 206, 0.5)',
                            boxShadow: '0 25px 50px -12px rgba(82, 92, 58, 0.15)',
                            textAlign: 'center'
                        }}
                    >
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3a3f2c', marginBottom: '0.5rem' }}>
                            Welcome
                        </h1>
                        <p style={{ color: '#849362', fontSize: '0.875rem', marginBottom: '2rem' }}>
                            Sign in with Google to continue
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => console.log('Login Failed')}
                                shape="pill"
                                size="large"
                                width="300"
                            />
                        </div>

                        {isLoading && (
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#525c3a' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span style={{ fontSize: '0.875rem' }}>Authenticating...</span>
                            </div>
                        )}

                        {error && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '0.75rem',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '0.5rem',
                                color: '#dc2626',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
