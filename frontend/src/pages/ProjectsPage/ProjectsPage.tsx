import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import './ProjectsPage.css';

interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export function ProjectsPage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

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

    return (
        <div className="projects-page">
            <header className="projects-header">
                <Link to="/" className="logo">
                    <span className="logo-text">LaTeX</span>
                    <span className="logo-accent">Studio</span>
                </Link>
                <div className="header-right">
                    <span className="user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="projects-main">
                <div className="projects-title-row">
                    <h1>My Projects</h1>
                    <button className="create-btn" onClick={() => setIsCreating(true)}>
                        <Plus size={20} />
                        <span>New Project</span>
                    </button>
                </div>

                {isCreating && (
                    <div className="create-form">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project name..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateProject();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                        />
                        <button onClick={handleCreateProject}>Create</button>
                        <button onClick={() => setIsCreating(false)} className="cancel">Cancel</button>
                    </div>
                )}

                {isLoading ? (
                    <div className="loading">
                        <Loader2 size={32} className="spin" />
                        <span>Loading projects...</span>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h2>No projects yet</h2>
                        <p>Create your first project to get started!</p>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <div key={project.id} className="project-card">
                                <Link to={`/editor/${project.id}`} className="project-link">
                                    <div className="project-icon">
                                        <FileText size={24} />
                                    </div>
                                    <h3>{project.name}</h3>
                                    <p className="project-date">Updated {formatDate(project.updatedAt)}</p>
                                </Link>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteProject(project.id, project.name)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
