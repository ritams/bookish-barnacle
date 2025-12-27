import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { latex } from 'codemirror-lang-latex';
import { useEditorStore } from '../../stores/editorStore';
import './Editor.css';

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
            </div>
            <div ref={editorRef} className="editor-content flex-1 overflow-auto" />
        </div>
    );
}
