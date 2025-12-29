import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Crown, Pencil, Eye, Trash2, Loader2, Mail, Check, Share2 } from 'lucide-react';
import { collaboratorsApi } from '../../services/collaboratorsApi';
import type { Collaborator } from '../../services/collaboratorsApi';

interface CollaboratorManagerProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CollaboratorManager({ projectId, isOpen, onClose }: CollaboratorManagerProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'editor' | 'viewer'>('editor');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && projectId) {
            loadCollaborators();
        }
    }, [isOpen, projectId]);

    const loadCollaborators = async () => {
        setIsLoading(true);
        try {
            const data = await collaboratorsApi.getCollaborators(projectId);
            setCollaborators(data.collaborators);
        } catch (err) {
            setError('Failed to load collaborators');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsInviting(true);
        setError(null);
        setSuccess(null);

        try {
            await collaboratorsApi.addCollaborator(projectId, { email: email.trim(), role });
            setSuccess(`Invited ${email} as ${role}`);
            setEmail('');
            loadCollaborators();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to invite collaborator');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (collaboratorId: string, newRole: 'editor' | 'viewer') => {
        try {
            await collaboratorsApi.updateCollaborator(projectId, collaboratorId, { role: newRole });
            loadCollaborators();
        } catch (err) {
            setError('Failed to update role');
        }
    };

    const handleRemove = async (collaboratorId: string) => {
        try {
            await collaboratorsApi.removeCollaborator(projectId, collaboratorId);
            loadCollaborators();
        } catch (err) {
            setError('Failed to remove collaborator');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown size={14} />;
            case 'editor': return <Pencil size={14} />;
            case 'viewer': return <Eye size={14} />;
            default: return null;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
            case 'editor': return { bg: '#ecfeff', text: '#0891b2', border: '#67e8f9' };
            case 'viewer': return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
            default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '1rem',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '28rem',
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '2.25rem',
                                height: '2.25rem',
                                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                borderRadius: '0.625rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                            }}>
                                <Share2 size={16} />
                            </div>
                            <div>
                                <h2 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    margin: 0,
                                }}>
                                    Share Project
                                </h2>
                                <p style={{
                                    fontSize: '0.8125rem',
                                    color: '#64748b',
                                    margin: '0.125rem 0 0 0',
                                }}>
                                    Invite people to collaborate
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            style={{
                                width: '2rem',
                                height: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '0.5rem',
                                color: '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            <X size={16} />
                        </motion.button>
                    </div>

                    {/* Invite Form */}
                    <form onSubmit={handleInvite} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute',
                                    left: '0.875rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8',
                                }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    style={{
                                        width: '100%',
                                        height: '2.5rem',
                                        paddingLeft: '2.5rem',
                                        paddingRight: '0.875rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.625rem',
                                        fontSize: '0.875rem',
                                        color: '#1e293b',
                                        background: '#fff',
                                        outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#06b6d4';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                                style={{
                                    height: '2.5rem',
                                    padding: '0 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.625rem',
                                    fontSize: '0.8125rem',
                                    color: '#334155',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isInviting || !email.trim()}
                                style={{
                                    height: '2.5rem',
                                    padding: '0 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    border: 'none',
                                    borderRadius: '0.625rem',
                                    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                                    color: '#fff',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    cursor: isInviting || !email.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isInviting || !email.trim() ? 0.5 : 1,
                                    boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.2)',
                                }}
                            >
                                {isInviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                Invite
                            </motion.button>
                        </div>

                        {/* Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        marginTop: '0.75rem',
                                        padding: '0.625rem 0.875rem',
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '0.5rem',
                                        color: '#dc2626',
                                        fontSize: '0.8125rem',
                                    }}
                                >
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        marginTop: '0.75rem',
                                        padding: '0.625rem 0.875rem',
                                        background: '#ecfeff',
                                        border: '1px solid #67e8f9',
                                        borderRadius: '0.5rem',
                                        color: '#0891b2',
                                        fontSize: '0.8125rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <Check size={14} />
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* Collaborators List */}
                    <div style={{ maxHeight: '18rem', overflowY: 'auto' }}>
                        {isLoading ? (
                            <div style={{
                                padding: '3rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: '#64748b',
                            }}>
                                <Loader2 size={24} className="animate-spin" />
                                <span style={{ fontSize: '0.875rem' }}>Loading...</span>
                            </div>
                        ) : collaborators.length === 0 ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: '#64748b',
                            }}>
                                <div style={{
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    background: '#f1f5f9',
                                    borderRadius: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 0.75rem auto',
                                }}>
                                    <UserPlus size={24} style={{ color: '#94a3b8' }} />
                                </div>
                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>No collaborators yet</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#94a3b8' }}>
                                    Invite someone to get started
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: '0.5rem 0' }}>
                                {collaborators.map((collab, index) => {
                                    const colors = getRoleColor(collab.role);
                                    return (
                                        <motion.div
                                            key={collab.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            style={{
                                                padding: '0.875rem 1.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.875rem',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Avatar */}
                                            <div style={{
                                                width: '2.25rem',
                                                height: '2.25rem',
                                                borderRadius: '0.625rem',
                                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                flexShrink: 0,
                                            }}>
                                                {collab.user.name?.charAt(0).toUpperCase() || collab.user.email?.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: '#1e293b',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {collab.user.name || 'Unknown'}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#64748b',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {collab.user.email}
                                                </div>
                                            </div>

                                            {/* Role Badge */}
                                            {collab.role === 'owner' ? (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.375rem',
                                                    padding: '0.25rem 0.625rem',
                                                    background: colors.bg,
                                                    border: `1px solid ${colors.border}`,
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    color: colors.text,
                                                }}>
                                                    {getRoleIcon(collab.role)}
                                                    Owner
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <select
                                                        value={collab.role}
                                                        onChange={(e) => handleRoleChange(collab.id, e.target.value as 'editor' | 'viewer')}
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            background: colors.bg,
                                                            border: `1px solid ${colors.border}`,
                                                            borderRadius: '0.375rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            color: colors.text,
                                                            cursor: 'pointer',
                                                            outline: 'none',
                                                        }}
                                                    >
                                                        <option value="editor">Editor</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleRemove(collab.id)}
                                                        style={{
                                                            width: '1.75rem',
                                                            height: '1.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: '#94a3b8',
                                                            cursor: 'pointer',
                                                            borderRadius: '0.375rem',
                                                            transition: 'color 0.15s, background 0.15s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.color = '#dc2626';
                                                            e.currentTarget.style.background = '#fef2f2';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.color = '#94a3b8';
                                                            e.currentTarget.style.background = 'transparent';
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </motion.button>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
