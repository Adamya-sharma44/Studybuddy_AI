import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', instructor: '', credits: '', color: '#6366f1' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data.subjects);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSubjects(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', code: '', instructor: '', credits: '', color: '#6366f1' }); setError(''); setShowModal(true); };
    const openEdit = (s) => { setEditing(s); setForm({ name: s.name, code: s.code || '', instructor: s.instructor || '', credits: s.credits || '', color: s.color || '#6366f1' }); setError(''); setShowModal(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            if (editing) {
                await api.put(`/subjects/${editing._id}`, form);
            } else {
                await api.post('/subjects', form);
            }
            setShowModal(false);
            fetchSubjects();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save subject');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject and all its assignments?')) return;
        try { await api.delete(`/subjects/${id}`); fetchSubjects(); }
        catch (err) { alert('Failed to delete subject'); }
    };

    return (
        <div className="page-wrapper">
            <Navbar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📚 Subjects</h1>
                        <p className="page-subtitle">Manage your enrolled courses</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}>+ Add Subject</button>
                </div>

                {loading ? (
                    <div className="loading-state"><div className="spinner-lg"></div></div>
                ) : subjects.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <h3>No subjects yet</h3>
                        <p>Add your first subject to get started</p>
                        <button className="btn btn-primary" onClick={openCreate}>Add Subject</button>
                    </div>
                ) : (
                    <div className="subjects-grid">
                        {subjects.map((s) => (
                            <div key={s._id} className="subject-card" style={{ '--subject-color': s.color }}>
                                <div className="subject-color-bar" style={{ background: s.color }}></div>
                                <div className="subject-body">
                                    <div className="subject-top">
                                        <div>
                                            <h3 className="subject-name">{s.name}</h3>
                                            {s.code && <span className="subject-code">{s.code}</span>}
                                        </div>
                                        <div className="subject-actions">
                                            <button className="icon-btn" onClick={() => openEdit(s)} title="Edit">✏️</button>
                                            <button className="icon-btn danger" onClick={() => handleDelete(s._id)} title="Delete">🗑️</button>
                                        </div>
                                    </div>
                                    <div className="subject-info">
                                        {s.instructor && <p>👨‍🏫 {s.instructor}</p>}
                                        {s.credits > 0 && <p>🎓 {s.credits} credits</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Subject' : 'Add Subject'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            {error && <div className="alert alert-error">{error}</div>}
                            <div className="form-group">
                                <label className="form-label">Subject Name *</label>
                                <input className="form-input" placeholder="e.g. Data Structures" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Course Code</label>
                                    <input className="form-input" placeholder="e.g. CS201" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Credits</label>
                                    <input type="number" className="form-input" placeholder="3" min="0" max="10" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instructor</label>
                                <input className="form-input" placeholder="Prof. Smith" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Color</label>
                                <div className="color-picker">
                                    {COLORS.map((c) => (
                                        <button type="button" key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <span className="spinner"></span> : editing ? 'Save Changes' : 'Add Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
