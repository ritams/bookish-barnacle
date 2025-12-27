import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { latex } from 'codemirror-lang-latex';
import { Download } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import './Editor.css';

const editorTheme = EditorView.theme({
    '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: '#1e1e2e',
    },
    '.cm-content': {
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        caretColor: '#f5e0dc',
    },
    '.cm-cursor': {
        borderLeftColor: '#f5e0dc',
    },
    '.cm-selectionBackground, ::selection': {
        backgroundColor: '#45475a !important',
    },
    '.cm-gutters': {
        backgroundColor: '#181825',
        color: '#6c7086',
        borderRight: '1px solid #313244',
    },
    '.cm-activeLineGutter': {
        backgroundColor: '#313244',
    },
    '.cm-activeLine': {
        backgroundColor: '#1e1e2e80',
    },
    '.cm-line': {
        padding: '0 4px',
    },
});

interface EditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
}

export function Editor({ initialContent = '', onChange }: EditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const { currentFile, updateFileContent } = useEditorStore();

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

    const handleSave = () => {
        if (!currentFile) return;

        let blob: Blob;
        const filename = currentFile.name;

        if (isImage && currentFile.content.startsWith('data:')) {
            // Convert base64 to blob for images
            const [header, data] = currentFile.content.split(',');
            const mimeMatch = header.match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            const binary = atob(data);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            blob = new Blob([array], { type: mime });
        } else {
            // Text file
            blob = new Blob([currentFile.content], { type: 'text/plain' });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (!editorRef.current || isImage) return;

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                handleChange(update.state.doc.toString());
            }
        });

        const state = EditorState.create({
            doc: currentFile?.content || initialContent,
            extensions: [
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
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...completionKeymap,
                    indentWithTab,
                ]),
                latex(),
                editorTheme,
                updateListener,
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
    }, [isImage, currentFile?.id]);

    // Update content when file changes
    useEffect(() => {
        if (viewRef.current && currentFile && !isImage) {
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
    }, [currentFile?.id, isImage]);

    // Render image preview for image files
    if (isImage && currentFile) {
        return (
            <div className="editor-container">
                <div className="editor-header">
                    <span className="editor-filename">{currentFile.name}</span>
                    <button className="save-btn" onClick={handleSave} title="Download file">
                        <Download size={16} />
                    </button>
                </div>
                <div className="image-preview">
                    <img
                        src={currentFile.content}
                        alt={currentFile.name}
                        style={{ maxWidth: '100%', maxHeight: 'calc(100% - 40px)', objectFit: 'contain' }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="editor-container">
            <div className="editor-header">
                <span className="editor-filename">
                    {currentFile?.name || 'No file selected'}
                </span>
                {currentFile && (
                    <button className="save-btn" onClick={handleSave} title="Download file">
                        <Download size={16} />
                    </button>
                )}
            </div>
            <div ref={editorRef} className="editor-content" />
        </div>
    );
}
