import { Link } from 'react-router-dom';
import { FileText, Zap, Lock, Users } from 'lucide-react';
import './LandingPage.css';

export function LandingPage() {
    return (
        <div className="landing-page">
            <header className="landing-header">
                <div className="logo">
                    <span className="logo-text">LaTeX</span>
                    <span className="logo-accent">Studio</span>
                </div>
                <nav className="landing-nav">
                    <Link to="/login" className="nav-link">Log In</Link>
                    <Link to="/signup" className="nav-btn">Sign Up Free</Link>
                </nav>
            </header>

            <main className="landing-main">
                <section className="hero">
                    <h1>
                        Write LaTeX.
                        <span className="gradient-text"> Beautifully.</span>
                    </h1>
                    <p className="hero-subtitle">
                        A modern, browser-based LaTeX editor with real-time PDF preview.
                        No installation required.
                    </p>
                    <div className="hero-actions">
                        <Link to="/signup" className="btn-primary">Get Started Free</Link>
                        <Link to="/login" className="btn-secondary">Log In</Link>
                    </div>
                </section>

                <section className="features">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Instant Compilation</h3>
                        <p>Compile your LaTeX documents instantly and see the PDF preview in real-time.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileText size={24} />
                        </div>
                        <h3>Multi-File Projects</h3>
                        <p>Organize your work with multiple files, images, and bibliography support.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Lock size={24} />
                        </div>
                        <h3>Cloud Storage</h3>
                        <p>Your projects are safely stored in the cloud. Access them from anywhere.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Users size={24} />
                        </div>
                        <h3>Collaboration</h3>
                        <p>Share projects and collaborate with others in real-time. (Coming soon)</p>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>© 2024 LaTeX Studio. Built with ❤️</p>
            </footer>
        </div>
    );
}
