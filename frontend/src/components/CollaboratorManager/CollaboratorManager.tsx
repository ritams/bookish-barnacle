import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Crown, Pencil, Eye, Trash2, Loader2, Mail, Check } from 'lucide-react';
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
            case 'editor': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
            case 'viewer': return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
            default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
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
                    background: 'rgba(30, 33, 22, 0.4)',
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
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(220, 227, 206, 0.6)',
                        boxShadow: '0 25px 50px -12px rgba(82, 92, 58, 0.25)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #eef1e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <h2 style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                color: '#3a3f2c',
                                margin: 0,
                            }}>
                                Share Project
                            </h2>
                            <p style={{
                                fontSize: '0.8125rem',
                                color: '#849362',
                                margin: '0.25rem 0 0 0',
                            }}>
                                Invite people to collaborate
                            </p>
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
                                background: '#f8f9f4',
                                borderRadius: '0.5rem',
                                color: '#849362',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </motion.button>
                    </div>

                    {/* Invite Form */}
                    <form onSubmit={handleInvite} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eef1e6' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute',
                                    left: '0.875rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#a3b082',
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
                                        border: '1px solid #dce3ce',
                                        borderRadius: '0.625rem',
                                        fontSize: '0.875rem',
                                        color: '#3a3f2c',
                                        background: '#fff',
                                        outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#a3b082';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(163, 176, 130, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#dce3ce';
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
                                    border: '1px solid #dce3ce',
                                    borderRadius: '0.625rem',
                                    fontSize: '0.8125rem',
                                    color: '#525c3a',
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
                                    background: '#525c3a',
                                    color: '#fff',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    cursor: isInviting || !email.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isInviting || !email.trim() ? 0.5 : 1,
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
                                        background: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '0.5rem',
                                        color: '#16a34a',
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
                                color: '#849362',
                            }}>
                                <Loader2 size={24} className="animate-spin" />
                                <span style={{ fontSize: '0.875rem' }}>Loading...</span>
                            </div>
                        ) : collaborators.length === 0 ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: '#849362',
                            }}>
                                <UserPlus size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>No collaborators yet</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', opacity: 0.7 }}>
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
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9f4'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Avatar */}
                                            <div style={{
                                                width: '2.25rem',
                                                height: '2.25rem',
                                                borderRadius: '0.625rem',
                                                background: 'linear-gradient(135deg, #a3b082 0%, #849362 100%)',
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
                                                    color: '#3a3f2c',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {collab.user.name || 'Unknown'}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#849362',
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
                                                            color: '#a3b082',
                                                            cursor: 'pointer',
                                                            borderRadius: '0.375rem',
                                                            transition: 'color 0.15s, background 0.15s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.color = '#dc2626';
                                                            e.currentTarget.style.background = '#fef2f2';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.color = '#a3b082';
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
