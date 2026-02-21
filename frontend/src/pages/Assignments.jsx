import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const TYPES = ['homework', 'project', 'exam', 'quiz', 'presentation', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ subject: '', title: '', description: '', type: 'homework', dueDate: '', priority: 'medium', estimatedHours: 2 });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        try {
            const [aRes, sRes] = await Promise.all([api.get('/assignments'), api.get('/subjects')]);
            setAssignments(aRes.data.data.assignments);
            setSubjects(sRes.data.data.subjects);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const filtered = assignments.filter((a) => {
        if (filter === 'pending') return !a.isCompleted;
        if (filter === 'completed') return a.isCompleted;
        return true;
    });

    const openCreate = () => { setEditing(null); setForm({ subject: subjects[0]?._id || '', title: '', description: '', type: 'homework', dueDate: '', priority: 'medium', estimatedHours: 2 }); setError(''); setShowModal(true); };
    const openEdit = (a) => { setEditing(a); setForm({ subject: a.subject?._id || '', title: a.title, description: a.description || '', type: a.type, dueDate: a.dueDate?.split('T')[0], priority: a.priority, estimatedHours: a.estimatedHours }); setError(''); setShowModal(true); };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            if (editing) { await api.put(`/assignments/${editing._id}`, form); }
            else { await api.post('/assignments', form); }
            setShowModal(false); fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this assignment?')) return;
        try { await api.delete(`/assignments/${id}`); fetchAll(); }
        catch { alert('Failed to delete'); }
    };

    const updateProgress = async (id, progress) => {
        try { await api.patch(`/assignments/${id}/progress`, { progress: Number(progress) }); fetchAll(); }
        catch { console.error('progress update failed'); }
    };

    const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

    const getDaysLeft = (date) => {
        const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: 'Overdue', cls: 'overdue' };
        if (diff === 0) return { label: 'Due Today', cls: 'today' };
        if (diff === 1) return { label: 'Tomorrow', cls: 'soon' };
        return { label: `${diff}d`, cls: diff <= 3 ? 'soon' : 'normal' };
    };

    return (
        <div className="page-wrapper">
            <Navbar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📝 Assignments</h1>
                        <p className="page-subtitle">{assignments.length} assignments tracked</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreate} disabled={subjects.length === 0}>+ Add Assignment</button>
                </div>

                {subjects.length === 0 && !loading && (
                    <div className="alert alert-info">ℹ️ Add a subject first before creating assignments.</div>
                )}

                <div className="filter-tabs">
                    {['all', 'pending', 'completed'].map((f) => (
                        <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            <span className="tab-count">{
                                f === 'all' ? assignments.length :
                                    f === 'pending' ? assignments.filter(a => !a.isCompleted).length :
                                        assignments.filter(a => a.isCompleted).length
                            }</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-state"><div className="spinner-lg"></div></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>No assignments found</h3>
                        <p>{filter !== 'all' ? 'Try switching filters' : 'Add your first assignment!'}</p>
                    </div>
                ) : (
                    <div className="assignment-list-full">
                        {filtered.map((a) => {
                            const due = getDaysLeft(a.dueDate);
                            return (
                                <div key={a._id} className={`assignment-full-card ${a.isCompleted ? 'completed' : ''}`}>
                                    <div className="afc-color" style={{ background: a.subject?.color || '#6366f1' }}></div>
                                    <div className="afc-body">
                                        <div className="afc-top">
                                            <div className="afc-info">
                                                <h3 className="afc-title">{a.title}</h3>
                                                <div className="afc-meta">
                                                    <span className="badge" style={{ background: a.subject?.color + '33', color: a.subject?.color }}>{a.subject?.name}</span>
                                                    <span className="badge badge-type">{a.type}</span>
                                                    <span className={`due-badge due-${due.cls}`}>{due.label}</span>
                                                    <span className="priority-tag" style={{ color: priorityColor[a.priority] }}>● {a.priority}</span>
                                                    <span className="hours-tag">⏱ {a.estimatedHours}h</span>
                                                </div>
                                                {a.description && <p className="afc-desc">{a.description}</p>}
                                            </div>
                                            <div className="afc-actions">
                                                <button className="icon-btn" onClick={() => openEdit(a)}>✏️</button>
                                                <button className="icon-btn danger" onClick={() => handleDelete(a._id)}>🗑️</button>
                                            </div>
                                        </div>
                                        <div className="afc-progress">
                                            <div className="progress-row">
                                                <span className="progress-text">{a.progress}% complete {a.isCompleted && '✅'}</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={a.progress}
                                                className="progress-slider"
                                                onChange={(e) => updateProgress(a._id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Assignment' : 'Add Assignment'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            {error && <div className="alert alert-error">{error}</div>}
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <select className="form-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input className="form-input" placeholder="Assignment title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows="2" placeholder="What needs to be done?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Due Date *</label>
                                    <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Est. Hours</label>
                                    <input type="number" className="form-input" min="0.5" max="100" step="0.5" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <span className="spinner"></span> : editing ? 'Save Changes' : 'Add Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
