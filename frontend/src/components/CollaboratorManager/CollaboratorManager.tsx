import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mail, Shield, ShieldOff, Trash2, Loader2, Check, Link as LinkIcon } from 'lucide-react';
import { collaboratorsApi, type Collaborator, type AddCollaboratorRequest } from '../../services/collaboratorsApi';
import { useAuthStore } from '../../stores/authStore';

interface CollaboratorManagerProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CollaboratorManager({ projectId, isOpen, onClose }: CollaboratorManagerProps) {
    const { user: currentUser } = useAuthStore();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [isValidatingEmail, setIsValidatingEmail] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [newRole, setNewRole] = useState<'editor' | 'viewer'>('editor');
    const [showSuccess, setShowSuccess] = useState(false);

    // Check if current user is the owner
    const isOwner = collaborators.some(c => c.user.id === currentUser?.id && c.role === 'owner');

    useEffect(() => {
        if (isOpen && projectId) {
            loadCollaborators();
        }
    }, [isOpen, projectId]);


    const loadCollaborators = async () => {
        try {
            setIsLoading(true);
            const data = await collaboratorsApi.getCollaborators(projectId);
            setCollaborators(data.collaborators);
        } catch (error) {
            console.error('Failed to load collaborators:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const checkIfUserExists = async (email: string): Promise<boolean> => {
        try {
            setIsValidatingEmail(true);
            setEmailError('');

            // Check if user is already a collaborator
            if (collaborators.some(c => c.user.email === email)) {
                setEmailError('This user is already a collaborator');
                return false;
            }

            // Check if user exists in the system
            const data = await collaboratorsApi.searchUsers(email);
            const userExists = data.users.some(user => user.email === email);

            if (!userExists) {
                setEmailError('No user found with this email address');
                return false;
            }

            return true;
        } catch (error) {
            setEmailError('Failed to validate email');
            return false;
        } finally {
            setIsValidatingEmail(false);
        }
    };

    const handleAddCollaborator = async () => {
        if (!emailInput.trim()) {
            setEmailError('Please enter an email address');
            return;
        }

        if (!validateEmail(emailInput)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        const userExists = await checkIfUserExists(emailInput);
        if (!userExists) return;

        try {
            setIsAdding(true);
            const request: AddCollaboratorRequest = {
                email: emailInput,
                role: newRole,
            };

            await collaboratorsApi.addCollaborator(projectId, request);

            // Reset form
            setEmailInput('');
            setEmailError('');
            setNewRole('editor');

            // Reload collaborators
            await loadCollaborators();

            // Show success feedback
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            setEmailError(error instanceof Error ? error.message : 'Failed to add collaborator');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateRole = async (collaboratorId: string, role: 'editor' | 'viewer') => {
        try {
            await collaboratorsApi.updateCollaborator(projectId, collaboratorId, { role });
            await loadCollaborators();
        } catch (error) {
            console.error('Failed to update role:', error);
            alert(error instanceof Error ? error.message : 'Failed to update role');
        }
    };

    const handleRemoveCollaborator = async (collaboratorId: string) => {
        if (!confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            await collaboratorsApi.removeCollaborator(projectId, collaboratorId);
            await loadCollaborators();
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
            alert(error instanceof Error ? error.message : 'Failed to remove collaborator');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Shield size={14} className="text-amber-600" />;
            case 'editor':
                return <Mail size={14} className="text-blue-600" />;
            case 'viewer':
                return <ShieldOff size={14} className="text-gray-600" />;
            default:
                return null;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'owner': return 'Owner';
            case 'editor': return 'Editor';
            case 'viewer': return 'Viewer';
            default: return role;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Share Project</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Manage access and permissions</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/editor/${projectId}`;
                                    navigator.clipboard.writeText(url);
                                    setShowSuccess(true);
                                    setTimeout(() => setShowSuccess(false), 2000);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-olive-700 bg-olive-50 hover:bg-olive-100/80 rounded-lg transition-colors border border-olive-200/50"
                            >
                                {showSuccess ? <Check size={16} /> : <LinkIcon size={16} />}
                                <span>{showSuccess ? 'Copied' : 'Copy Link'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Invite Section (Distinct Background) */}
                        {isOwner && (
                            <div className="bg-gray-50/80 px-6 py-6 border-b border-gray-100 flex flex-col gap-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Invite by Email
                                </label>
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="email"
                                                placeholder="colleague@example.com"
                                                value={emailInput}
                                                onChange={(e) => {
                                                    setEmailInput(e.target.value);
                                                    setEmailError('');
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 transition-all text-sm"
                                            />
                                        </div>
                                        <div className="relative w-32">
                                            <select
                                                value={newRole}
                                                onChange={(e) => setNewRole(e.target.value as 'editor' | 'viewer')}
                                                className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-olive-500/20 cursor-pointer appearance-none"
                                            >
                                                <option value="editor">Can edit</option>
                                                <option value="viewer">Can view</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleAddCollaborator}
                                            disabled={!emailInput.trim() || isAdding || isValidatingEmail}
                                            className="px-5 py-2.5 bg-olive-600 hover:bg-olive-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {isAdding || isValidatingEmail ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                            <span>Invite</span>
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {emailError && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-500 text-sm pl-1"
                                            >
                                                {emailError}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Members List */}
                        <div className="px-6 py-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Members
                                </h3>
                                <div className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
                                    {collaborators.length}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="py-12 flex justify-center">
                                    <Loader2 className="animate-spin text-olive-500" size={24} />
                                </div>
                            ) : collaborators.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-sm">No members yet.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {collaborators.map((collaborator) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={collaborator.id}
                                            className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-olive-200/50 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-olive-100 to-olive-200 flex items-center justify-center text-olive-700 font-bold text-sm border border-olive-200/50">
                                                    {collaborator.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {collaborator.user.name}
                                                        {currentUser?.id === collaborator.user.id && <span className="ml-2 text-xs text-gray-400 font-normal">(You)</span>}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{collaborator.user.email}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {isOwner && collaborator.role !== 'owner' ? (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={collaborator.role}
                                                            onChange={(e) => handleUpdateRole(collaborator.id, e.target.value as 'editor' | 'viewer')}
                                                            className="text-xs font-medium text-gray-600 bg-transparent py-1 pl-2 pr-6 border-none focus:ring-0 cursor-pointer hover:text-gray-900"
                                                        >
                                                            <option value="editor">Editor</option>
                                                            <option value="viewer">Viewer</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md border border-gray-200/50">
                                                        {getRoleIcon(collaborator.role)}
                                                        <span className="text-xs font-medium text-gray-600">{getRoleLabel(collaborator.role)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
