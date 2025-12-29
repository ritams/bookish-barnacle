import { useState, useRef, useEffect } from 'react';
import {
    FileText,
    Folder,
    FolderOpen,
    FolderPlus,
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Image,
    Upload,
    Play,
    Edit3,
    Move,
    MoreVertical,
} from 'lucide-react';
import { useEditorStore, type File as EditorFile, type Folder as EditorFolder } from '../../stores/editorStore';
import { api } from '../../services/api';

interface FileTreeItem {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    mimeType?: string;
    children?: FileTreeItem[];
    isExplicitFolder?: boolean; // true if folder exists in DB
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    item: FileTreeItem | null;
}

// Get icon based on file type
function getFileIcon(name: string, mimeType?: string) {
    if (mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(name)) {
        return <Image size={16} className="shrink-0 text-pink-500" />;
    }
    return <FileText size={16} className="shrink-0 text-olive-600" />;
}

function buildFileTree(
    files: EditorFile[],
    folders: EditorFolder[]
): FileTreeItem[] {
    const root: FileTreeItem[] = [];
    const map = new Map<string, FileTreeItem>();

    // First, add all explicit folders
    const sortedFolders = [...folders].sort((a, b) => a.path.localeCompare(b.path));
    for (const folder of sortedFolders) {
        const parts = folder.path.split('/');
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!map.has(currentPath)) {
                const item: FileTreeItem = {
                    id: isLast ? folder.id : `folder-${currentPath}`,
                    name: part,
                    path: currentPath,
                    type: 'folder',
                    children: [],
                    isExplicitFolder: isLast,
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

    // Then add files, creating implicit folders as needed
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
    onContextMenu: (e: React.MouseEvent, item: FileTreeItem) => void;
    onToggleExpand: (path: string, isExpanded: boolean) => void;
    selectedId: string | null;
    expandedPaths: Set<string>;
}

function FileTreeNode({
    item,
    depth,
    onSelect,
    onDelete,
    onContextMenu,
    onToggleExpand,
    selectedId,
    expandedPaths,
}: FileTreeNodeProps) {
    const isExpanded = expandedPaths.has(item.path);
    const isSelected = item.id === selectedId;

    const handleClick = () => {
        if (item.type === 'folder') {
            onToggleExpand(item.path, !isExpanded);
        } else {
            onSelect(item);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu(e, item);
    };

    return (
        <div>
            <div
                className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer transition-colors select-none group ${isSelected ? 'bg-olive-200' : 'hover:bg-olive-100'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            >
                {item.type === 'folder' && (
                    <span className="text-olive-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {item.type === 'folder' ? (
                    isExpanded ? (
                        <FolderOpen size={16} className="shrink-0 text-amber-500" />
                    ) : (
                        <Folder size={16} className="shrink-0 text-amber-500" />
                    )
                ) : (
                    getFileIcon(item.name, item.mimeType)
                )}
                <span className="flex-1 text-sm truncate text-olive-800">{item.name}</span>
                <button
                    className="p-1 rounded text-olive-400 hover:bg-olive-200 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, item);
                    }}
                    title="More actions"
                >
                    <MoreVertical size={14} />
                </button>
            </div>
            {item.type === 'folder' && isExpanded && item.children && (
                <div>
                    {item.children.map((child) => (
                        <FileTreeNode
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onContextMenu={onContextMenu}
                            onToggleExpand={onToggleExpand}
                            selectedId={selectedId}
                            expandedPaths={expandedPaths}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ContextMenuProps {
    state: ContextMenuState;
    onClose: () => void;
    onRename: (item: FileTreeItem) => void;
    onMove: (item: FileTreeItem) => void;
    onDelete: (item: FileTreeItem) => void;
    onCompile: (item: FileTreeItem) => void;
}

function ContextMenu({ state, onClose, onRename, onMove, onDelete, onCompile }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (state.visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [state.visible, onClose]);

    if (!state.visible || !state.item) return null;

    const isTexFile = state.item.type === 'file' && state.item.name.endsWith('.tex');

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white border border-olive-200 rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: state.x, top: state.y }}
        >
            {isTexFile && (
                <button
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-olive-100 text-olive-800"
                    onClick={() => {
                        onCompile(state.item!);
                        onClose();
                    }}
                >
                    <Play size={14} className="text-green-600" />
                    Compile
                </button>
            )}
            <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-olive-100 text-olive-800"
                onClick={() => {
                    onRename(state.item!);
                    onClose();
                }}
            >
                <Edit3 size={14} />
                Rename
            </button>
            <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-olive-100 text-olive-800"
                onClick={() => {
                    onMove(state.item!);
                    onClose();
                }}
            >
                <Move size={14} />
                Move
            </button>
            <div className="border-t border-olive-200 my-1" />
            <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
                onClick={() => {
                    onDelete(state.item!);
                    onClose();
                }}
            >
                <Trash2 size={14} />
                Delete
            </button>
        </div>
    );
}

interface FileManagerProps {
    projectId?: string;
    onCompileFile?: (filePath: string) => void;
}

export function FileManager({ projectId, onCompileFile }: FileManagerProps) {
    const {
        files,
        folders,
        currentFile,
        setCurrentFile,
        addFile,
        removeFile,
        addFolder,
        removeFolder,
        setActiveDirectory,
        loadFileContent,
        renameFile,
        moveFile,
    } = useEditorStore();

    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        item: null,
    });
    const [renameItem, setRenameItem] = useState<FileTreeItem | null>(null);
    const [moveItem, setMoveItem] = useState<FileTreeItem | null>(null);
    const [newName, setNewName] = useState('');
    const [newPath, setNewPath] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const tree = buildFileTree(files, folders);

    // Get active directory based on expanded paths
    const getActiveDirectory = (): string => {
        const expandedArray = Array.from(expandedPaths);
        if (expandedArray.length === 0) return '';
        // Return the most recently expanded (deepest) path
        return expandedArray.reduce((a, b) => (a.length > b.length ? a : b), '');
    };

    const handleToggleExpand = (path: string, isExpanded: boolean) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (isExpanded) {
                next.add(path);
                setActiveDirectory(path);
            } else {
                next.delete(path);
            }
            return next;
        });
    };

    const handleSelect = async (item: FileTreeItem) => {
        if (item.type === 'file') {
            const file = files.find((f) => f.id === item.id);
            if (file) {
                setCurrentFile(file);
                // Lazy load content if not loaded
                if (!file.isLoaded && file.content === null) {
                    await loadFileContent(file.id);
                }
            }
        }
    };

    const handleDelete = async (item: FileTreeItem) => {
        if (item.type === 'file') {
            if (!confirm(`Delete ${item.name}?`)) return;

            try {
                // Delete from backend if it's a real file
                if (!item.id.startsWith('file-')) {
                    await api.files.delete(item.id);
                }
                removeFile(item.id);
            } catch (error) {
                console.error('Failed to delete file:', error);
                alert('Failed to delete file');
            }
        } else if (item.type === 'folder' && item.isExplicitFolder) {
            if (!confirm(`Delete folder "${item.name}" and all its contents?`)) return;

            try {
                await api.folders.delete(item.id);
                removeFolder(item.id);
                // Also remove files in this folder from local state
                files
                    .filter((f) => f.path.startsWith(`${item.path}/`))
                    .forEach((f) => removeFile(f.id));
            } catch (error) {
                console.error('Failed to delete folder:', error);
                alert('Failed to delete folder');
            }
        }
    };

    const handleContextMenu = (e: React.MouseEvent, item: FileTreeItem) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            item,
        });
    };

    const handleRename = (item: FileTreeItem) => {
        setRenameItem(item);
        setNewName(item.name);
    };

    const handleRenameSubmit = async () => {
        if (!renameItem || !newName.trim()) {
            setRenameItem(null);
            return;
        }

        try {
            if (renameItem.type === 'file' && !renameItem.id.startsWith('file-')) {
                await renameFile(renameItem.id, newName.trim());
            } else if (renameItem.type === 'folder' && renameItem.isExplicitFolder) {
                // Build new path
                const pathParts = renameItem.path.split('/');
                pathParts[pathParts.length - 1] = newName.trim();
                const newFolderPath = pathParts.join('/');

                await api.folders.update(renameItem.id, { path: newFolderPath, name: newName.trim() });
                // Refresh would be needed here
            }
        } catch (error) {
            console.error('Failed to rename:', error);
            alert('Failed to rename');
        }

        setRenameItem(null);
        setNewName('');
    };

    const handleMove = (item: FileTreeItem) => {
        setMoveItem(item);
        setNewPath(item.path);
    };

    const handleMoveSubmit = async () => {
        if (!moveItem || !newPath.trim()) {
            setMoveItem(null);
            return;
        }

        try {
            if (moveItem.type === 'file' && !moveItem.id.startsWith('file-')) {
                await moveFile(moveItem.id, newPath.trim());
            }
        } catch (error) {
            console.error('Failed to move:', error);
            alert('Failed to move file');
        }

        setMoveItem(null);
        setNewPath('');
    };

    const handleCompile = (item: FileTreeItem) => {
        if (onCompileFile && item.type === 'file' && item.name.endsWith('.tex')) {
            onCompileFile(item.path);
        }
    };

    const handleCreateFile = async () => {
        if (newItemName.trim()) {
            const fileName = newItemName.trim();
            const activeDir = getActiveDirectory();
            let filePath = activeDir ? `${activeDir}/${fileName}` : fileName;
            filePath = filePath.replace(/^\/+/, '');

            try {
                if (projectId) {
                    // Create in backend
                    const response = await api.files.create({
                        projectId,
                        path: filePath,
                        name: fileName,
                        content: '',
                        mimeType: fileName.endsWith('.tex') ? 'text/x-tex' : 'text/plain',
                    });
                    addFile({
                        ...response.data,
                        isLoaded: true,
                    });
                } else {
                    // Local only
                    addFile({
                        id: `file-${Date.now()}`,
                        path: filePath,
                        name: fileName,
                        content: '',
                        mimeType: fileName.endsWith('.tex') ? 'text/x-tex' : 'text/plain',
                        isLoaded: true,
                    });
                }
            } catch (error) {
                console.error('Failed to create file:', error);
                alert('Failed to create file');
            }

            setNewItemName('');
            setIsCreatingFile(false);
        }
    };

    const handleCreateFolder = async () => {
        if (newItemName.trim()) {
            const folderName = newItemName.trim();
            const activeDir = getActiveDirectory();
            let folderPath = activeDir ? `${activeDir}/${folderName}` : folderName;
            folderPath = folderPath.replace(/^\/+/, '');

            try {
                if (projectId) {
                    const response = await api.folders.create({
                        projectId,
                        path: folderPath,
                        name: folderName,
                    });
                    addFolder(response.data);
                    // Expand the new folder
                    handleToggleExpand(folderPath, true);
                }
            } catch (error) {
                console.error('Failed to create folder:', error);
                alert('Failed to create folder');
            }

            setNewItemName('');
            setIsCreatingFolder(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (!uploadedFiles) return;

        const activeDir = getActiveDirectory();

        for (const file of Array.from(uploadedFiles)) {
            const reader = new FileReader();

            reader.onload = async () => {
                const content = reader.result as string;
                // Sanitize path to avoid double slashes
                let filePath = activeDir ? `${activeDir}/${file.name}` : file.name;
                filePath = filePath.replace(/^\/+/, '');

                try {
                    if (projectId) {
                        const response = await api.files.create({
                            projectId,
                            path: filePath,
                            name: file.name,
                            content: content,
                            mimeType: file.type || 'application/octet-stream',
                        });
                        addFile({
                            ...response.data,
                            isLoaded: true,
                        });
                    } else {
                        addFile({
                            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            path: filePath,
                            name: file.name,
                            content: content,
                            mimeType: file.type || 'application/octet-stream',
                            isLoaded: true,
                        });
                    }
                } catch (error) {
                    console.error('Failed to upload file:', error);
                    alert(`Failed to upload ${file.name}`);
                }
            };

            const isBinary = file.type.startsWith('image/') ||
                file.type === 'application/pdf' ||
                /\.(pdf|png|jpe?g|gif|svg|webp|eot|ttf|woff|woff2|otf)$/i.test(file.name);

            if (isBinary) {
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
                        onClick={() => setIsCreatingFolder(true)}
                        title="New folder"
                    >
                        <FolderPlus size={16} />
                    </button>
                    <button
                        className="flex items-center justify-center w-6 h-6 rounded text-olive-500 hover:bg-olive-200 hover:text-olive-700 transition-colors"
                        onClick={() => setIsCreatingFile(true)}
                        title="New file"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Hidden file input - allow all files */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* New file input */}
            {isCreatingFile && (
                <div className="px-3 py-2 border-b border-olive-200">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFile();
                            if (e.key === 'Escape') setIsCreatingFile(false);
                        }}
                        placeholder="filename.tex"
                        autoFocus
                        className="w-full bg-olive-50 border border-olive-200 rounded text-sm text-olive-800 placeholder:text-olive-400 focus:outline-none focus:border-olive-600 transition-all font-medium"
                        style={{
                            padding: '0.625rem 0.875rem',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                        }}
                    />
                    <p className="text-xs text-olive-400 mt-1">
                        Creating in: {getActiveDirectory() || '/'}
                    </p>
                </div>
            )}

            {/* New folder input */}
            {isCreatingFolder && (
                <div className="px-3 py-2 border-b border-olive-200">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') setIsCreatingFolder(false);
                        }}
                        placeholder="folder name"
                        autoFocus
                        className="w-full bg-olive-50 border border-olive-200 rounded text-sm text-olive-800 placeholder:text-olive-400 focus:outline-none focus:border-olive-600 transition-all font-medium"
                        style={{
                            padding: '0.625rem 0.875rem',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                        }}
                    />
                    <p className="text-xs text-olive-400 mt-1">
                        Creating in: {getActiveDirectory() || '/'}
                    </p>
                </div>
            )}

            {/* Rename dialog */}
            {renameItem && (
                <div className="px-3 py-2 border-b border-olive-200 bg-amber-50">
                    <p className="text-xs text-olive-600 mb-1">Rename: {renameItem.name}</p>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit();
                            if (e.key === 'Escape') setRenameItem(null);
                        }}
                        autoFocus
                        className="w-full bg-white border border-olive-200 rounded text-sm text-olive-800 focus:outline-none focus:border-olive-600 transition-all font-medium"
                        style={{
                            padding: '0.625rem 0.875rem',
                        }}
                    />
                </div>
            )}

            {/* Move dialog */}
            {moveItem && (
                <div className="px-3 py-2 border-b border-olive-200 bg-blue-50">
                    <p className="text-xs text-olive-600 mb-1">Move: {moveItem.name}</p>
                    <input
                        type="text"
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleMoveSubmit();
                            if (e.key === 'Escape') setMoveItem(null);
                        }}
                        placeholder="new/path/filename.tex"
                        autoFocus
                        className="w-full bg-white border border-olive-200 rounded text-sm text-olive-800 focus:outline-none focus:border-olive-600 transition-all font-medium"
                        style={{
                            padding: '0.625rem 0.875rem',
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
                            onContextMenu={handleContextMenu}
                            onToggleExpand={handleToggleExpand}
                            selectedId={currentFile?.id || null}
                            expandedPaths={expandedPaths}
                        />
                    ))
                )}
            </div>

            {/* Context Menu */}
            <ContextMenu
                state={contextMenu}
                onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                onRename={handleRename}
                onMove={handleMove}
                onDelete={handleDelete}
                onCompile={handleCompile}
            />
        </div>
    );
}
