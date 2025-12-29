import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Play, Loader2, ArrowLeft, Download, CheckCircle2, Share } from 'lucide-react';
import { Editor } from '../../components/Editor';
import { FileManager } from '../../components/FileManager';
import { PDFViewer } from '../../components/PDFViewer';
import { CollaboratorManager } from '../../components/CollaboratorManager/CollaboratorManager';
import { useEditorStore } from '../../stores/editorStore';
import { compileLatex } from '../../services/latex';
import { api } from '../../services/api';
import { LogoIcon } from '../../components/Logo';

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
    const [project, setProject] = useState<ProjectData | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [showCompileSuccess, setShowCompileSuccess] = useState(false);
    const [showCollaboratorManager, setShowCollaboratorManager] = useState(false);

    const {
        setFiles,
        setFolders,
        setCurrentFile,
        setIsCompiling,
        setCompilationError,
        setPdfUrl,
        setPdfBase64,
        pdfBase64,
        currentFile,
        isCompiling,
        loadFileContent
    } = useEditorStore();

    // Track target file for compilation (can be set via context menu)
    const [compileTarget, setCompileTarget] = useState<string>('main.tex');

    // Load project and files from API
    useEffect(() => {
        if (!projectId) return;

        const loadProject = async () => {
            try {
                const response = await api.projects.get(projectId);
                setProject(response.data);

                // Set folders
                if (response.data.folders) {
                    setFolders(response.data.folders);
                }

                if (response.data.files && response.data.files.length > 0) {
                    // Files come with content: null for lazy loading
                    setFiles(response.data.files.map((f: { id: string; path: string; name: string; mimeType: string; content: string | null }) => ({
                        ...f,
                        isLoaded: false,
                    })));

                    // Set first file as current and load its content
                    const firstFile = response.data.files[0];
                    setCurrentFile({ ...firstFile, isLoaded: false });

                    // Load first file content
                    if (firstFile.id) {
                        loadFileContent(firstFile.id);
                    }
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
                        isLoaded: true,
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

    const handleCompile = async (targetFile?: string) => {
        if (!projectId || isCompiling) return;

        const target = targetFile || compileTarget || currentFile?.path || 'main.tex';

        setIsCompiling(true);
        setCompilationError(null);

        try {
            // Use new compile API with projectId and targetFile
            const result = await compileLatex(projectId, target);

            if (result.success && result.pdf) {
                const pdfUrl = URL.createObjectURL(result.pdf);
                setPdfUrl(pdfUrl);
                const base64 = await blobToBase64(result.pdf);
                setPdfBase64(base64);

                // Show success indicator
                setShowCompileSuccess(true);
                setTimeout(() => setShowCompileSuccess(false), 2000);
            } else {
                setCompilationError(result.log || 'Compilation failed');
            }
        } catch (error) {
            setCompilationError(error instanceof Error ? error.message : 'Compilation failed');
        } finally {
            setIsCompiling(false);
        }
    };

    // Handle compile from FileManager context menu
    const handleCompileFile = (filePath: string) => {
        setCompileTarget(filePath);
        handleCompile(filePath);
    };

    const handleDownloadPdf = () => {
        if (!pdfBase64) return;
        const link = document.createElement('a');
        link.href = pdfBase64;
        link.download = `${project?.name || 'document'}.pdf`;
        link.click();
    };



    if (isLoadingProject) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-olive-50 to-olive-100">
                <motion.div
                    className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-olive-200/50"
                    animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Loader2 size={32} className="animate-spin text-olive-600" />
                </motion.div>
                <motion.span
                    className="text-olive-600 text-lg font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Loading project...
                </motion.span>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-olive-100 font-sans">
            {/* Header */}
            <motion.header
                className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-olive-200 shadow-sm"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            to="/projects"
                            className="flex items-center justify-center w-9 h-9 border border-olive-200 rounded-xl text-olive-500 hover:bg-olive-50 hover:text-olive-700 hover:border-olive-300 transition-all"
                            title="Back to Projects"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                    </motion.div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 overflow-hidden rounded-lg shadow-md">
                            <LogoIcon style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div>
                            <span className="text-base font-semibold text-olive-800 block leading-tight">
                                {project?.name || 'Project'}
                            </span>
                            <span className="text-xs text-olive-400">LaTeX Document</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pdfBase64 && (
                        <motion.button
                            className="flex items-center h-10 border border-olive-200 text-olive-600 rounded-xl hover:bg-olive-50 hover:border-olive-300 transition-colors text-sm font-medium overflow-hidden"
                            style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                            initial="initial"
                            whileHover="hover"
                            animate="initial"
                            onClick={handleDownloadPdf}
                            title="Download PDF"
                        >
                            <Download size={18} className="flex-shrink-0" />
                            <motion.span
                                variants={{
                                    initial: { width: 0, opacity: 0, marginLeft: 0 },
                                    hover: { width: 'auto', opacity: 1, marginLeft: '0.625rem' }
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                            >
                                Download
                            </motion.span>
                            <motion.div
                                variants={{
                                    initial: { width: 0 },
                                    hover: { width: '0.25rem' }
                                }}
                            />
                        </motion.button>
                    )}

                    {/* Share Button */}
                    <motion.button
                        className="flex items-center h-10 bg-olive-100 text-olive-700 border border-olive-200 rounded-xl hover:bg-olive-200 hover:border-olive-300 transition-colors text-sm font-medium overflow-hidden"
                        style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                        initial="initial"
                        whileHover="hover"
                        animate="initial"
                        onClick={() => setShowCollaboratorManager(true)}
                        title="Manage Collaborators"
                    >
                        <Share size={18} className="flex-shrink-0" />
                        <motion.span
                            variants={{
                                initial: { width: 'auto', opacity: 1, marginLeft: '0.625rem' },
                                hover: { width: 'auto', opacity: 1, marginLeft: '0.625rem' }
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                        >
                            Share
                        </motion.span>
                    </motion.button>

                    <motion.button
                        className="flex items-center h-10 bg-olive-700 hover:bg-olive-800 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg overflow-hidden disabled:opacity-50"
                        style={{ paddingLeft: '0.875rem', paddingRight: '0.875rem' }}
                        initial="initial"
                        whileHover="hover"
                        animate="initial"
                        onClick={() => handleCompile()}
                        disabled={isCompiling}
                        title="Compile LaTeX"
                    >
                        {isCompiling ? (
                            <Loader2 size={18} className="animate-spin flex-shrink-0" />
                        ) : showCompileSuccess ? (
                            <CheckCircle2 size={18} className="flex-shrink-0" />
                        ) : (
                            <Play size={18} className="flex-shrink-0" />
                        )}
                        <motion.span
                            variants={{
                                initial: { width: 0, opacity: 0, marginLeft: 0 },
                                hover: { width: 'auto', opacity: 1, marginLeft: '0.625rem' }
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                        >
                            {isCompiling ? 'Compiling' : showCompileSuccess ? 'Done!' : 'Compile'}
                        </motion.span>
                        <motion.div
                            variants={{
                                initial: { width: 0 },
                                hover: { width: '0.25rem' }
                            }}
                        />
                    </motion.button>
                </div>
            </motion.header>

            {/* Main Editor Area */}
            <main className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal" autoSaveId="editor-layout">
                    <Panel defaultSize={15} minSize={10} maxSize={25}>
                        <FileManager
                            projectId={projectId}
                            onCompileFile={handleCompileFile}
                        />
                    </Panel>

                    <PanelResizeHandle className="w-1.5 bg-olive-200 hover:bg-olive-400 active:bg-olive-500 transition-colors cursor-col-resize group">
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="w-0.5 h-8 bg-olive-300 rounded-full group-hover:bg-olive-500 transition-colors" />
                        </div>
                    </PanelResizeHandle>

                    <Panel defaultSize={45} minSize={30}>
                        <Editor
                            projectId={projectId}
                            fileId={currentFile?.id}
                        />
                    </Panel>

                    <PanelResizeHandle className="w-1.5 bg-olive-200 hover:bg-olive-400 active:bg-olive-500 transition-colors cursor-col-resize group">
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="w-0.5 h-8 bg-olive-300 rounded-full group-hover:bg-olive-500 transition-colors" />
                        </div>
                    </PanelResizeHandle>

                    <Panel defaultSize={40} minSize={25}>
                        <PDFViewer />
                    </Panel>
                </PanelGroup>
            </main>

            {/* Collaborator Manager Modal */}
            {projectId && (
                <CollaboratorManager
                    projectId={projectId}
                    isOpen={showCollaboratorManager}
                    onClose={() => setShowCollaboratorManager(false)}
                />
            )}
        </div>
    );
}
