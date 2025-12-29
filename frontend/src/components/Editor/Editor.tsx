import { useEffect, useRef, useCallback, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { latex } from 'codemirror-lang-latex';
import { ArrowUpFromLine, Loader2, Check, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';
import { useCollaboration } from '../../hooks/useCollaboration';
import { yCollab } from 'y-codemirror.next';
import './Editor.css';
import './CollaboratorCursors.css';

// Track previous collaborators count to show notifications
function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>(value);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

// Light olive theme for CodeMirror
const editorTheme = EditorView.theme({
    '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: '#ffffff',
    },
    '.cm-content': {
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        caretColor: '#4d5439',
    },
    '.cm-cursor': {
        borderLeftColor: '#4d5439',
    },
    '.cm-selectionBackground, ::selection': {
        backgroundColor: '#dde2d3 !important',
    },
    '.cm-gutters': {
        backgroundColor: '#f7f8f5',
        color: '#808c64',
        borderRight: '1px solid #dde2d3',
    },
    '.cm-activeLineGutter': {
        backgroundColor: '#eef0e8',
    },
    '.cm-activeLine': {
        backgroundColor: '#f7f8f580',
    },
    '.cm-line': {
        padding: '0 4px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
    },
});

interface EditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    projectId?: string;
    fileId?: string;
}

export function Editor({ initialContent = '', onChange, projectId, fileId }: EditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const { currentFile, updateFileContent, saveCurrentFile, isSaving } = useEditorStore();
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Collaboration state
    const collaboration = useCollaboration(
        projectId || null,
        fileId || null,
        !!(projectId && fileId) // Enable collaboration only when both IDs are available
    );

    const { user } = useAuthStore();
    console.log('[Editor] Current user from auth store:', user);
    console.log('[Editor] Collaboration state:', collaboration);

    // Debug: Check token contents
    const token = useAuthStore.getState().token;
    if (token) {
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            console.log('[Editor] Decoded token:', decoded);
        } catch (error) {
            console.log('[Editor] Could not decode token:', error);
        }
    }

    const prevCollaborators = usePrevious(collaboration.collaborators);

    useEffect(() => {
        if (!prevCollaborators) return;

        // Check for new users
        if (collaboration.collaborators.length > prevCollaborators.length) {
            const newUsers = collaboration.collaborators.filter(c =>
                !prevCollaborators.some(p => p.socketId === c.socketId)
            );
            newUsers.forEach(user => {
                toast.success(`${user.name || 'A user'} joined the session`);
            });
        }

        // Check for left users
        if (collaboration.collaborators.length < prevCollaborators.length) {
            const leftUsers = prevCollaborators.filter(p =>
                !collaboration.collaborators.some(c => c.socketId === p.socketId)
            );
            leftUsers.forEach(user => {
                toast.info(`${user.name || 'A user'} left the session`);
            });
        }
    }, [collaboration.collaborators, prevCollaborators]);

    // Get project and file IDs from current file if not provided as props
    const effectiveProjectId = projectId || (typeof window !== 'undefined' ?
        window.location.pathname.split('/')[2] : null);
    const effectiveFileId = fileId || currentFile?.id;

    // Check if current file is an image
    const isImage = currentFile?.mimeType?.startsWith('image/') ||
        /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(currentFile?.name || '');

    const handleChange = useCallback(
        (content: string) => {
            if (currentFile) {
                updateFileContent(currentFile.id, content);
            }
            onChange?.(content);
        },
        [currentFile, updateFileContent, onChange]
    );

    const handleSave = useCallback(async () => {
        const success = await saveCurrentFile();
        if (success) {
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        }
    }, [saveCurrentFile]);

    // Global keyboard shortcut for Ctrl/Cmd+S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    useEffect(() => {
        if (!editorRef.current || isImage) return;

        // Create save keymap for CodeMirror
        const saveKeymap = keymap.of([
            {
                key: 'Mod-s',
                run: () => {
                    handleSave();
                    return true;
                },
            },
        ]);

        // Base extensions that are always included
        const baseExtensions = [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            EditorView.lineWrapping,
            saveKeymap,
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...historyKeymap,
                ...completionKeymap,
                indentWithTab,
            ]),
            latex(),
            editorTheme,
        ];

        // Collaboration extensions
        const collaborationExtensions = [];
        let updateListener = null;

        if (collaboration.doc && collaboration.provider && collaboration.awareness) {
            // Use Yjs for collaboration
            const ytext = collaboration.doc.getText('content');

            // Set local user info in awareness state
            const { user } = useAuthStore.getState();
            if (user) {
                collaboration.awareness.setLocalStateField('user', {
                    name: user.name,
                    color: '#4d5439', // Fallback color, though SocketIOProvider should set a better one
                });
            }

            collaborationExtensions.push(
                yCollab(ytext, collaboration.awareness)
            );

            // Update local store when Yjs document changes
            collaboration.doc.on('update', () => {
                const content = ytext.toString();
                if (currentFile) {
                    updateFileContent(currentFile.id, content);
                }
                onChange?.(content);
            });
        }
        else {
            // Fallback to local state when not collaborating
            updateListener = EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    handleChange(update.state.doc.toString());
                }
            });
        }

        // Create editor state
        const state = EditorState.create({
            doc: collaboration.doc ?
                collaboration.doc.getText('content').toString() :
                currentFile?.content || initialContent,
            extensions: [
                ...baseExtensions,
                ...collaborationExtensions,
                ...(updateListener ? [updateListener] : []),
            ],
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, [isImage, currentFile?.id, collaboration.doc, collaboration.provider, collaboration.awareness]);

    // Update content when file changes (only for non-collaborative mode)
    useEffect(() => {
        if (viewRef.current && currentFile && !isImage && !collaboration.doc) {
            const currentContent = viewRef.current.state.doc.toString();
            if (currentContent !== currentFile.content) {
                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: currentContent.length,
                        insert: currentFile.content,
                    },
                });
            }
        }
    }, [currentFile?.id, isImage, collaboration.doc]);

    // Render image preview for image files
    if (isImage && currentFile) {
        return (
            <div className="flex flex-col h-full bg-white text-olive-800">
                <div className="flex items-center justify-between px-4 py-2 bg-olive-50 border-b border-olive-200 min-h-[40px]">
                    <span className="text-sm font-medium text-olive-700">{currentFile.name}</span>
                </div>
                <div className="flex-1 flex items-center justify-center bg-olive-50 p-5 overflow-auto">
                    <img
                        src={currentFile.content}
                        alt={currentFile.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white text-olive-800">
            <div className="flex items-center justify-between px-4 py-2 bg-olive-50 border-b border-olive-200 min-h-[40px]">
                <span className="text-sm font-medium text-olive-700">
                    {currentFile?.name || 'No file selected'}
                </span>
                <div className="flex items-center gap-2">
                    {/* Collaborators display */}
                    {collaboration.isConnected && (
                        <div className="collaborators-list">
                            <div className="flex items-center gap-2 mr-3">
                                <Users size={14} className="text-olive-500" />
                                <span className="text-xs text-olive-600">
                                    {collaboration.collaborators.length}
                                </span>
                            </div>
                            {collaboration.collaborators.map((collaborator) => {
                                console.log('[Editor] Rendering collaborator:', collaborator);
                                return (
                                    <div
                                        key={collaborator.socketId}
                                        className="collaborator-avatar"
                                        style={{ backgroundColor: collaborator.color }}
                                        title={collaborator.name || 'Unknown User'}
                                    >
                                        <span className="collaborator-initial">
                                            {collaborator.name ? collaborator.name.charAt(0).toUpperCase() :
                                                (collaborator.socketId ? collaborator.socketId.slice(0, 2).toUpperCase() : 'U')}
                                        </span>
                                        <span className="collaborator-full-name">{collaborator.name || 'Unknown User'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Connection status indicator */}
                    {effectiveProjectId && effectiveFileId && (
                        <div className="flex items-center gap-1 mr-2">
                            <div
                                className={`w-2 h-2 rounded-full ${collaboration.isConnected ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                                title={collaboration.isConnected ? 'Connected' : 'Disconnected'}
                            />
                            <span className="text-xs text-olive-600">
                                {collaboration.isConnected ? 'Live' : 'Offline'}
                            </span>
                        </div>
                    )}

                    {currentFile && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-olive-600 hover:bg-olive-700 text-white shadow-sm hover:shadow"
                            title="Save (Ctrl/Cmd+S)"
                        >
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : showSaveSuccess ? (
                                <Check size={16} />
                            ) : (
                                <ArrowUpFromLine size={16} />
                            )}
                        </button>
                    )}
                </div>
            </div>
            <div ref={editorRef} className="editor-content flex-1 overflow-auto" />
        </div>
    );
}
