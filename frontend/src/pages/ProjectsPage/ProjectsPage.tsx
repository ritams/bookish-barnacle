import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Trash2, LogOut, FolderOpen, Search, X, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { Logo } from '../../components/Logo';

interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

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

export function ProjectsPage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.user-menu-container')) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    const loadProjects = async () => {
        try {
            const response = await api.projects.list();
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const response = await api.projects.create({
                name: newProjectName.trim(),
                description: '',
            });
            setProjects([response.data, ...projects]);
            setNewProjectName('');
            setIsCreating(false);
            navigate(`/editor/${response.data.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

        try {
            await api.projects.delete(id);
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f9f4 0%, #fff 50%, #f8f9f4 100%)', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <motion.header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(220, 227, 206, 0.5)'
                }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 2rem',
                    maxWidth: '1280px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <Logo size="md" linkTo="/" animate={true} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-menu-container" style={{ position: 'relative' }}>
                            <motion.button
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.625rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(238, 241, 230, 0.6)',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                whileHover={{ background: 'rgba(238, 241, 230, 0.9)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    background: 'linear-gradient(135deg, #849362 0%, #687549 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span style={{ color: '#525c3a', fontSize: '0.875rem', fontWeight: 500 }}>
                                    {user?.name?.split(' ')[0] || 'User'}
                                </span>
                            </motion.button>

                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 0.75rem)',
                                            right: 0,
                                            width: '12rem',
                                            background: 'white',
                                            border: '1px solid #dce3ce',
                                            borderRadius: '1rem',
                                            boxShadow: '0 10px 25px -5px rgba(82, 92, 58, 0.15)',
                                            padding: '0.5rem',
                                            zIndex: 60
                                        }}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f2eb', marginBottom: '0.5rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#3a3f2c' }}>{user?.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#849362' }}>{user?.email}</p>
                                        </div>
                                        <motion.button
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                borderRadius: '0.75rem',
                                                background: 'transparent',
                                                color: '#687549',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={handleLogout}
                                            whileHover={{ background: '#fef2f2', color: '#dc2626' }}
                                        >
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem 4rem' }}>
                {/* Page Header */}
                <motion.div
                    style={{ marginBottom: '2rem' }}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.5 }}
                >
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#3a3f2c', marginBottom: '0.5rem' }}>My Projects</h1>
                    <p style={{ color: '#849362' }}>Manage and organize your LaTeX documents</p>
                </motion.div>

                {/* Actions Bar */}
                <motion.div
                    style={{ display: 'flex', flexDirection: 'row', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: isSearchFocused ? '#687549' : '#a3b082',
                                transition: 'color 0.2s'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            style={{
                                width: '100%',
                                paddingLeft: '3rem',
                                paddingRight: '1rem',
                                paddingTop: '0.875rem',
                                paddingBottom: '0.875rem',
                                background: 'white',
                                border: '1px solid #dce3ce',
                                borderRadius: '0.75rem',
                                color: '#3a3f2c',
                                fontSize: '1rem',
                                outline: 'none',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>
                    {/* New Project Button */}
                    <motion.button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem 1.5rem',
                            background: '#525c3a',
                            color: 'white',
                            borderRadius: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(82, 92, 58, 0.2)',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                        onClick={() => setIsCreating(true)}
                        whileHover={{ scale: 1.02, background: '#434a31' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus size={20} />
                        <span>New Project</span>
                    </motion.button>
                </motion.div>

                {/* Create Form */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            style={{
                                marginBottom: '2rem',
                                padding: '1.5rem',
                                background: 'white',
                                border: '1px solid #dce3ce',
                                borderRadius: '1rem',
                                boxShadow: '0 20px 25px -5px rgba(82, 92, 58, 0.1)'
                            }}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#434a31', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={18} color="#849362" />
                                    Create New Project
                                </h3>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '0.5rem',
                                        color: '#a3b082',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Enter project name..."
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateProject();
                                        if (e.key === 'Escape') setIsCreating(false);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(248, 249, 244, 0.5)',
                                        border: '1px solid #dce3ce',
                                        borderRadius: '0.75rem',
                                        color: '#3a3f2c',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                />
                                <motion.button
                                    onClick={handleCreateProject}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#525c3a',
                                        color: 'white',
                                        borderRadius: '0.75rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(82, 92, 58, 0.2)'
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Create
                                </motion.button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        border: '1px solid #dce3ce',
                                        color: '#687549',
                                        borderRadius: '0.75rem',
                                        fontWeight: 500,
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
                        <Loader2 size={32} color="#687549" className="animate-spin" />
                        <p style={{ color: '#849362', marginTop: '1rem' }}>Loading projects...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <motion.div
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            style={{
                                width: '6rem',
                                height: '6rem',
                                background: '#eef1e6',
                                borderRadius: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}
                            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <FolderOpen size={40} color="#a3b082" />
                        </motion.div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#525c3a', marginBottom: '0.5rem' }}>
                            {searchQuery ? 'No projects found' : 'No projects yet'}
                        </h2>
                        <p style={{ color: '#849362', marginBottom: '2rem', textAlign: 'center', maxWidth: '28rem' }}>
                            {searchQuery
                                ? 'Try a different search term or clear your search'
                                : 'Create your first LaTeX document and start writing beautiful papers!'}
                        </p>
                        {!searchQuery && (
                            <motion.button
                                onClick={() => setIsCreating(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '1rem 2rem',
                                    background: '#525c3a',
                                    color: 'white',
                                    borderRadius: '0.75rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 15px -3px rgba(82, 92, 58, 0.2)'
                                }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Plus size={20} />
                                <span>Create First Project</span>
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1.25rem'
                        }}
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                style={{
                                    position: 'relative',
                                    background: 'white',
                                    border: '1px solid #eef1e6',
                                    borderRadius: '1rem',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                variants={fadeInUp}
                                transition={{ duration: 0.4 }}
                                whileHover={{
                                    y: -8,
                                    boxShadow: '0 25px 50px -12px rgba(82, 92, 58, 0.15)',
                                    borderColor: '#dce3ce'
                                }}
                            >
                                <Link to={`/editor/${project.id}`} style={{ display: 'block', padding: '1.5rem', textDecoration: 'none' }}>
                                    <motion.div
                                        style={{
                                            width: '3rem',
                                            height: '3rem',
                                            background: 'linear-gradient(135deg, #eef1e6 0%, #dce3ce 100%)',
                                            borderRadius: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1rem',
                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                        }}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                    >
                                        <FileText size={22} color="#687549" />
                                    </motion.div>
                                    <h3 style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        color: '#434a31',
                                        marginBottom: '0.25rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {project.name}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: '#a3b082' }}>
                                        Updated {formatDate(project.updatedAt)}
                                    </p>
                                </Link>
                                <motion.button
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        padding: '0.625rem',
                                        borderRadius: '0.75rem',
                                        color: '#c2ccab',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDeleteProject(project.id, project.name);
                                    }}
                                    whileHover={{ scale: 1.1, background: '#fef2f2', color: '#dc2626' }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
