import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Play, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { Editor } from '../../components/Editor';
import { FileManager } from '../../components/FileManager';
import { PDFViewer } from '../../components/PDFViewer';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';
import { compileLatex } from '../../services/latex';
import { api } from '../../services/api';
import './EditorPage.css';

// Helper to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

interface ProjectData {
    id: string;
    name: string;
    files: Array<{
        id: string;
        path: string;
        name: string;
        content: string;
        mimeType: string;
    }>;
}

export function EditorPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(true);

    const {
        files,
        setFiles,
        setCurrentFile,
        setIsCompiling,
        setCompilationError,
        setPdfUrl,
        setPdfBase64,
        currentFile,
        isCompiling
    } = useEditorStore();

    // Load project and files from API
    useEffect(() => {
        if (!projectId) return;

        const loadProject = async () => {
            try {
                const response = await api.projects.get(projectId);
                setProject(response.data);

                if (response.data.files && response.data.files.length > 0) {
                    setFiles(response.data.files);
                    setCurrentFile(response.data.files[0]);
                } else {
                    // Create default file if none exist
                    const defaultFile = {
                        id: 'main-tex',
                        path: 'main.tex',
                        name: 'main.tex',
                        content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\title{${response.data.name}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing your document here!

\\end{document}
`,
                        mimeType: 'text/x-tex',
                    };
                    setFiles([defaultFile]);
                    setCurrentFile(defaultFile);
                }
            } catch (error) {
                console.error('Failed to load project:', error);
                navigate('/projects');
            } finally {
                setIsLoadingProject(false);
            }
        };

        loadProject();
    }, [projectId]);

    const handleCompile = async () => {
        if (!currentFile || isCompiling) return;

        setIsCompiling(true);
        setCompilationError(null);

        try {
            const filesToCompile = files.map(f => ({
                path: f.path,
                content: f.content,
            }));

            const result = await compileLatex(currentFile.path, filesToCompile);

            if (result.success && result.pdf) {
                const pdfUrl = URL.createObjectURL(result.pdf);
                setPdfUrl(pdfUrl);
                const base64 = await blobToBase64(result.pdf);
                setPdfBase64(base64);
            } else {
                setCompilationError(result.log || 'Compilation failed');
            }
        } catch (error) {
            setCompilationError(error instanceof Error ? error.message : 'Compilation failed');
        } finally {
            setIsCompiling(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (isLoadingProject) {
        return (
            <div className="editor-page loading">
                <Loader2 size={32} className="spin" />
                <span>Loading project...</span>
            </div>
        );
    }

    return (
        <div className="editor-page">
            <header className="editor-page-header">
                <div className="header-left">
                    <Link to="/projects" className="back-btn">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="project-info">
                        <span className="project-name">{project?.name || 'Project'}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="compile-btn"
                        onClick={handleCompile}
                        disabled={isCompiling}
                    >
                        {isCompiling ? (
                            <>
                                <Loader2 size={16} className="spin" />
                                <span>Compiling...</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>Compile</span>
                            </>
                        )}
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="editor-page-main">
                <PanelGroup direction="horizontal" autoSaveId="editor-layout">
                    <Panel defaultSize={15} minSize={10} maxSize={25}>
                        <FileManager />
                    </Panel>

                    <PanelResizeHandle className="resize-handle" />

                    <Panel defaultSize={45} minSize={30}>
                        <Editor />
                    </Panel>

                    <PanelResizeHandle className="resize-handle" />

                    <Panel defaultSize={40} minSize={25}>
                        <PDFViewer />
                    </Panel>
                </PanelGroup>
            </main>
        </div>
    );
}
