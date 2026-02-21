import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ subjects: 0, total: 0, pending: 0, completed: 0 });
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subRes, assRes] = await Promise.all([
                    api.get('/subjects'),
                    api.get('/assignments'),
                ]);
                const assignments = assRes.data.data.assignments;
                const pending = assignments.filter((a) => !a.isCompleted);
                const completed = assignments.filter((a) => a.isCompleted);
                const soon = pending
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 4);
                setStats({
                    subjects: subRes.data.data.count,
                    total: assignments.length,
                    pending: pending.length,
                    completed: completed.length,
                });
                setUpcoming(soon);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getDaysLeft = (date) => {
        const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: 'Overdue', cls: 'overdue' };
        if (diff === 0) return { label: 'Due Today', cls: 'today' };
        if (diff === 1) return { label: 'Tomorrow', cls: 'soon' };
        return { label: `${diff} days left`, cls: diff <= 3 ? 'soon' : 'normal' };
    };

    const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

    return (
        <div className="page-wrapper">
            <Navbar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                        <p className="page-subtitle">
                            {user?.university ? `${user.university} · ${user.major}` : 'Here\'s your academic overview'}
                        </p>
                    </div>
                    <Link to="/study-plan" className="btn btn-primary">
                        🤖 Generate AI Study Plan
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-lg"></div>
                        <p>Loading your dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card stat-purple">
                                <div className="stat-icon">📚</div>
                                <div className="stat-value">{stats.subjects}</div>
                                <div className="stat-label">Subjects</div>
                            </div>
                            <div className="stat-card stat-blue">
                                <div className="stat-icon">📝</div>
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Assignments</div>
                            </div>
                            <div className="stat-card stat-orange">
                                <div className="stat-icon">⏳</div>
                                <div className="stat-value">{stats.pending}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                            <div className="stat-card stat-green">
                                <div className="stat-icon">✅</div>
                                <div className="stat-value">{stats.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>

                        <div className="section-header">
                            <h2 className="section-title">Upcoming Deadlines</h2>
                            <Link to="/assignments" className="link-btn">View all →</Link>
                        </div>

                        {upcoming.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🎉</div>
                                <h3>No pending assignments!</h3>
                                <p>You're all caught up. Add new assignments to track your progress.</p>
                                <Link to="/assignments" className="btn btn-primary">Add Assignment</Link>
                            </div>
                        ) : (
                            <div className="assignment-list">
                                {upcoming.map((a) => {
                                    const due = getDaysLeft(a.dueDate);
                                    return (
                                        <div key={a._id} className="assignment-card">
                                            <div className="assignment-left">
                                                <div className="subject-dot" style={{ background: a.subject?.color || '#6366f1' }}></div>
                                                <div>
                                                    <h3 className="assignment-title">{a.title}</h3>
                                                    <p className="assignment-meta">
                                                        {a.subject?.name} · <span className="badge badge-type">{a.type}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="assignment-right">
                                                <span className={`due-badge due-${due.cls}`}>{due.label}</span>
                                                <div className="priority-dot" style={{ background: priorityColor[a.priority] }}></div>
                                                <div className="progress-mini">
                                                    <div className="progress-bar">
                                                        <div className="progress-fill" style={{ width: `${a.progress}%` }}></div>
                                                    </div>
                                                    <span className="progress-label">{a.progress}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
