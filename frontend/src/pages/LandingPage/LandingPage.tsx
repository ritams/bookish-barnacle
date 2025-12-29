import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap,
    Lock,
    Users,
    ArrowRight,
    Sparkles,
    Github,
    Twitter,
    Code2,
    CheckCircle2,
    Star,
    Globe,
    FileText,
    Snowflake
} from 'lucide-react';
import { Logo } from '../../components/Logo';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
};

// Floating shapes component - Winter Theme
function FloatingShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-cyan-300/20 to-slate-400/10 rounded-full blur-3xl"
                animate={{
                    y: [0, -30, 0],
                    x: [0, 20, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-40 right-[5%] w-96 h-96 bg-gradient-to-br from-slate-200/40 to-cyan-200/20 rounded-full blur-3xl"
                animate={{
                    y: [0, 40, 0],
                    x: [0, -15, 0],
                    scale: [1, 0.95, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-40 left-[20%] w-64 h-64 bg-gradient-to-br from-slate-300/20 to-cyan-400/10 rounded-full blur-3xl"
                animate={{
                    y: [0, 25, 0],
                    scale: [1, 1.15, 1]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Decorative snowflake-like dots */}
            <motion.div
                className="absolute top-32 right-[15%] w-4 h-4 bg-cyan-400/60 rounded-full"
                animate={{ y: [0, -15, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
                className="absolute top-[60%] left-[8%] w-3 h-3 bg-slate-400/50 rounded-full"
                animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
                className="absolute top-[30%] left-[25%] w-2 h-2 bg-cyan-500/40 rounded-full"
                animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
        </div>
    );
}

// Feature card data
const features = [
    {
        icon: Zap,
        title: "Instant Compilation",
        description: "Lightning-fast LaTeX compilation with real-time PDF preview. See your changes instantly."
    },
    {
        icon: FileText,
        title: "Multi-File Projects",
        description: "Organize complex documents with multiple files, images, and bibliography support."
    },
    {
        icon: Lock,
        title: "Cloud Storage",
        description: "Your work is automatically saved and synced. Access from anywhere, anytime."
    },
    {
        icon: Users,
        title: "Collaboration",
        description: "Share projects and work together in real-time with your team. Coming soon!"
    }
];

// Stats data
const stats = [
    { value: "10K+", label: "Documents Created" },
    { value: "99.9%", label: "Uptime" },
    { value: "500+", label: "Active Users" },
    { value: "< 2s", label: "Compile Time" }
];

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 font-sans overflow-x-hidden">
            {/* Header */}
            <motion.header
                className="sticky top-0 z-50 glass border-b border-slate-100/50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
                    <Logo size="md" linkTo="/" animate={true} />
                    <nav className="flex items-center gap-3">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/login"
                                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-slate-300/30 hover:shadow-slate-400/40"
                            >
                                Get Started
                            </Link>
                        </motion.div>
                    </nav>
                </div>
            </motion.header>

            <main>
                {/* Hero Section */}
                <section className="relative min-h-[90vh] flex items-center justify-center w-full">
                    <FloatingShapes />

                    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 relative z-10">
                        <div style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }} className="max-w-4xl">
                            {/* Badge */}
                            <motion.div
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-full text-slate-700 text-sm font-medium mb-8 shadow-sm"
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.5 }}
                            >
                                <Snowflake size={16} className="text-cyan-500" />
                                <span>Free & Open Source</span>
                            </motion.div>

                            {/* Main Heading */}
                            <motion.h1
                                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight"
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.6, delay: 0.1 }}
                            >
                                <span className="text-slate-900">Write LaTeX</span>
                                <br />
                                <span className="bg-gradient-to-r from-slate-700 via-cyan-500 to-slate-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                                    Beautifully
                                </span>
                            </motion.h1>

                            {/* Subheading */}
                            <motion.p
                                className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed"
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                A modern, browser-based LaTeX editor with real-time PDF preview.
                                No installation required. Just write and publish.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl text-lg font-semibold transition-all shadow-xl shadow-slate-400/25 hover:shadow-slate-500/30 group"
                                    >
                                        Start Writing Free
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>
                            </motion.div>

                            {/* Trust indicators */}
                            <motion.div
                                className="mt-16 flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm"
                                variants={fadeIn}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-500" />
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-500" />
                                    <span>Instant setup</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-500" />
                                    <span>Full LaTeX support</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 bg-white/50 border-y border-slate-100">
                    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12">
                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-4 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className="text-center"
                                    variants={scaleIn}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="text-3xl lg:text-4xl font-bold text-slate-800 mb-1">
                                        {stat.value}
                                    </div>
                                    <div className="text-slate-500 text-sm font-medium">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 lg:py-32">
                    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12">
                        {/* Section Header */}
                        <motion.div
                            className="text-center mb-16 lg:mb-20"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Everything you need
                            </h2>
                            <p className="text-slate-500 text-lg lg:text-xl max-w-2xl mx-auto">
                                Powerful features designed for academics, researchers, and writers.
                            </p>
                        </motion.div>

                        {/* Features Grid */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="group p-8 bg-white rounded-3xl border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-2"
                                    variants={fadeInUp}
                                    transition={{ duration: 0.5 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <motion.div
                                        className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-slate-300/30 group-hover:shadow-slate-400/40 transition-shadow"
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                    >
                                        <feature.icon size={24} />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-500 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-24 lg:py-32 bg-slate-50/50">
                    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12">
                        <motion.div
                            className="text-center mb-16"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Simple & Powerful
                            </h2>
                            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                                Get started in seconds. No complex setup required.
                            </p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {[
                                { step: "01", title: "Create Account", description: "Sign up for free in seconds. No credit card required.", icon: Star },
                                { step: "02", title: "Write LaTeX", description: "Use our powerful editor with syntax highlighting and auto-complete.", icon: Code2 },
                                { step: "03", title: "Compile & Share", description: "Generate beautiful PDFs instantly and share with anyone.", icon: Globe }
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    className="relative"
                                    variants={fadeInUp}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="p-8 bg-white rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-5xl font-black text-slate-200">{item.step}</span>
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                                <item.icon size={22} />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                                        <p className="text-slate-500">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 lg:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-700 to-slate-800" />
                    <div className="absolute inset-0">
                        <motion.div
                            className="absolute top-10 left-10 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 6, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute bottom-10 right-10 w-80 h-80 bg-slate-500/20 rounded-full blur-3xl"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 8, repeat: Infinity }}
                        />
                    </div>

                    <motion.div
                        className="w-full max-w-4xl mx-auto px-6 lg:px-12 relative z-10"
                        style={{ textAlign: 'center' }}
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                            Ready to start writing?
                        </h2>
                        <p className="text-slate-300 text-lg lg:text-xl mb-12 max-w-xl mx-auto">
                            Join thousands of researchers and writers using Winter Archive.
                        </p>
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl text-lg font-bold transition-all shadow-2xl hover:shadow-3xl group"
                            >
                                Get Started
                                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-16 bg-slate-900 text-slate-400">
                <div className="max-w-6xl mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="mb-4">
                                <Logo size="md" variant="dark" showText={true} animate={false} />
                            </div>
                            <p className="text-slate-400 max-w-sm mb-6">
                                The modern way to write LaTeX documents. Beautiful, fast, and free.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <Github size={20} />
                                </a>
                                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <Twitter size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Resources</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm">© 2024 Winter Archive. Built with ❤️</p>
                        <div className="flex items-center gap-6 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
