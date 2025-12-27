import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { X, Mail, Lock, User } from 'lucide-react';
import './AuthModal.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const { login, register, isLoading, error, clearError } = useAuthStore();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLogin) {
            await login(email, password);
        } else {
            await register(email, password, name);
        }

        // Close on success (no error means successful)
        const currentError = useAuthStore.getState().error;
        if (!currentError) {
            onClose();
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        clearError();
        setEmail('');
        setPassword('');
        setName('');
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="subtitle">
                    {isLogin
                        ? 'Sign in to save your projects'
                        : 'Start writing LaTeX in the cloud'}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-group">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <p className="switch-mode">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={switchMode}>
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
