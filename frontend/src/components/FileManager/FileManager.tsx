import { useState, useRef } from 'react';
import {
    FileText,
    Folder,
    FolderOpen,
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Image,
    Upload,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

interface FileTreeItem {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    mimeType?: string;
    children?: FileTreeItem[];
}

// Get icon based on file type
function getFileIcon(name: string, mimeType?: string) {
    if (mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(name)) {
        return <Image size={16} className="shrink-0 text-pink-500" />;
    }
    return <FileText size={16} className="shrink-0 text-olive-600" />;
}

function buildFileTree(files: { id: string; path: string; name: string; mimeType: string }[]): FileTreeItem[] {
    const root: FileTreeItem[] = [];
    const map = new Map<string, FileTreeItem>();

    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
        const parts = file.path.split('/');
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!map.has(currentPath)) {
                const item: FileTreeItem = {
                    id: isLast ? file.id : `folder-${currentPath}`,
                    name: part,
                    path: currentPath,
                    type: isLast ? 'file' : 'folder',
                    mimeType: isLast ? file.mimeType : undefined,
                    children: isLast ? undefined : [],
                };
                map.set(currentPath, item);

                if (parentPath) {
                    const parent = map.get(parentPath);
                    parent?.children?.push(item);
                } else {
                    root.push(item);
                }
            }
        }
    }

    return root;
}

interface FileTreeNodeProps {
    item: FileTreeItem;
    depth: number;
    onSelect: (item: FileTreeItem) => void;
    onDelete: (item: FileTreeItem) => void;
    selectedId: string | null;
}

function FileTreeNode({ item, depth, onSelect, onDelete, selectedId }: FileTreeNodeProps) {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = item.id === selectedId;

    const handleClick = () => {
        if (item.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onSelect(item);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer transition-colors select-none group ${isSelected ? 'bg-olive-200' : 'hover:bg-olive-100'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
            >
                {item.type === 'folder' && (
                    <span className="text-olive-400">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {item.type === 'folder' ? (
                    isOpen ? (
                        <FolderOpen size={16} className="shrink-0 text-amber-500" />
                    ) : (
                        <Folder size={16} className="shrink-0 text-amber-500" />
                    )
                ) : (
                    getFileIcon(item.name, item.mimeType)
                )}
                <span className="flex-1 text-sm truncate text-olive-800">{item.name}</span>
                {item.type === 'file' && (
                    <button
                        className="p-1 rounded text-olive-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            {item.type === 'folder' && isOpen && item.children && (
                <div>
                    {item.children.map((child) => (
                        <FileTreeNode
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FileManager() {
    const { files, currentFile, setCurrentFile, addFile, removeFile } = useEditorStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tree = buildFileTree(files);

    const handleSelect = (item: FileTreeItem) => {
        if (item.type === 'file') {
            const file = files.find((f) => f.id === item.id);
            if (file) {
                setCurrentFile(file);
            }
        }
    };

    const handleDelete = (item: FileTreeItem) => {
        if (item.type === 'file' && confirm(`Delete ${item.name}?`)) {
            removeFile(item.id);
        }
    };

    const handleCreateFile = () => {
        if (newFileName.trim()) {
            const fileName = newFileName.trim();
            addFile({
                id: `file-${Date.now()}`,
                path: fileName,
                name: fileName,
                content: '',
                mimeType: fileName.endsWith('.tex') ? 'text/x-tex' : 'text/plain',
            });
            setNewFileName('');
            setIsCreating(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (!uploadedFiles) return;

        for (const file of Array.from(uploadedFiles)) {
            const reader = new FileReader();

            reader.onload = () => {
                const content = reader.result as string;
                const isImage = file.type.startsWith('image/');

                addFile({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    path: file.name,
                    name: file.name,
                    content: isImage ? content : content,
                    mimeType: file.type || 'application/octet-stream',
                });
            };

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        }

        e.target.value = '';
    };

    return (
        <div className="flex flex-col h-full bg-white text-olive-800 font-sans border-r border-olive-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-olive-50 border-b border-olive-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-olive-500">
                    Files
                </span>
                <div className="flex gap-1">
                    <button
                        className="flex items-center justify-center w-6 h-6 rounded text-olive-500 hover:bg-olive-200 hover:text-olive-700 transition-colors"
                        onClick={handleUploadClick}
                        title="Upload file"
                    >
                        <Upload size={16} />
                    </button>
                    <button
                        className="flex items-center justify-center w-6 h-6 rounded text-olive-500 hover:bg-olive-200 hover:text-olive-700 transition-colors"
                        onClick={() => setIsCreating(true)}
                        title="New file"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".tex,.bib,.sty,.cls,.png,.jpg,.jpeg,.gif,.svg,.webp,.pdf"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* New file input */}
            {isCreating && (
                <div className="px-3 py-2 border-b border-olive-200">
                    <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFile();
                            if (e.key === 'Escape') setIsCreating(false);
                        }}
                        placeholder="filename.tex"
                        autoFocus
                        className="w-full bg-olive-50 border border-olive-200 rounded text-sm text-olive-800 placeholder:text-olive-400 focus:outline-none focus:border-olive-600 transition-all font-medium"
                        style={{
                            padding: '0.625rem 0.875rem',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>
            )}

            {/* File tree */}
            <div className="flex-1 overflow-y-auto py-2">
                {tree.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-olive-400 text-sm">
                        No files yet
                    </div>
                ) : (
                    tree.map((item) => (
                        <FileTreeNode
                            key={item.id}
                            item={item}
                            depth={0}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            selectedId={currentFile?.id || null}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
