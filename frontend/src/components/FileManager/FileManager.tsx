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
import './FileManager.css';

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
        return <Image size={16} className="icon image-icon" />;
    }
    return <FileText size={16} className="icon file-icon" />;
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
        <div className="file-tree-node">
            <div
                className={`file-tree-item ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
            >
                {item.type === 'folder' && (
                    <span className="folder-toggle">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {item.type === 'folder' ? (
                    isOpen ? (
                        <FolderOpen size={16} className="icon folder-icon" />
                    ) : (
                        <Folder size={16} className="icon folder-icon" />
                    )
                ) : (
                    getFileIcon(item.name, item.mimeType)
                )}
                <span className="item-name">{item.name}</span>
                {item.type === 'file' && (
                    <button
                        className="delete-btn"
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
                <div className="file-tree-children">
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
                    content: isImage ? content : content, // base64 for images, text for others
                    mimeType: file.type || 'application/octet-stream',
                });
            };

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file); // Read images as base64
            } else {
                reader.readAsText(file); // Read text files as text
            }
        }

        // Reset input
        e.target.value = '';
    };

    return (
        <div className="file-manager">
            <div className="file-manager-header">
                <span className="header-title">Files</span>
                <div className="header-actions">
                    <button className="add-btn" onClick={handleUploadClick} title="Upload file">
                        <Upload size={16} />
                    </button>
                    <button className="add-btn" onClick={() => setIsCreating(true)} title="New file">
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".tex,.bib,.sty,.cls,.png,.jpg,.jpeg,.gif,.svg,.webp,.pdf"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />

            {isCreating && (
                <div className="new-file-input">
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
                    />
                </div>
            )}

            <div className="file-tree">
                {tree.length === 0 ? (
                    <div className="empty-state">No files yet</div>
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
