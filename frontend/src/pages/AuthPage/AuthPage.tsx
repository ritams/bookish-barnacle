import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import './AuthPage.css';

export function AuthPage() {
    const location = useLocation();
    const isLogin = location.pathname === '/login';
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

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

    return (
        <div className="auth-page">
            <Link to="/" className="back-link">
                <ArrowLeft size={20} />
                <span>Back to Home</span>
            </Link>

            <div className="auth-card">
                <div className="auth-header">
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>
                        {isLogin
                            ? 'Sign in to access your projects'
                            : 'Start writing LaTeX in the cloud'}
                    </p>
                </div>

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
