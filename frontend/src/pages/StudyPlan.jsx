import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function StudyPlan() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchPlans = async () => {
        try {
            const res = await api.get('/study-plans');
            setPlans(res.data.data.studyPlans);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPlans(); }, []);

    const generate = async () => {
        setGenerating(true); setError(''); setSuccess('');
        try {
            const res = await api.post('/study-plans/generate');
            setSuccess('🎉 AI study plan generated successfully!');
            fetchPlans();
            setSelectedPlan(res.data.data.studyPlan);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate study plan. Make sure you have pending assignments.');
        } finally { setGenerating(false); }
    };

    const deletePlan = async (id) => {
        if (!confirm('Delete this study plan?')) return;
        try {
            await api.delete(`/study-plans/${id}`);
            if (selectedPlan?._id === id) setSelectedPlan(null);
            fetchPlans();
        } catch { alert('Failed to delete'); }
    };

    const groupByDate = (sessions) => {
        return sessions.reduce((acc, s) => {
            const d = new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            if (!acc[d]) acc[d] = [];
            acc[d].push(s);
            return acc;
        }, {});
    };

    return (
        <div className="page-wrapper">
            <Navbar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🤖 AI Study Planner</h1>
                        <p className="page-subtitle">Let AI create a personalized study schedule from your assignments</p>
                    </div>
                    <button className="btn btn-primary btn-ai" onClick={generate} disabled={generating}>
                        {generating ? (
                            <><span className="spinner"></span> Generating with GPT-4...</>
                        ) : '✨ Generate Study Plan'}
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="sp-layout">
                    {/* Plans list */}
                    <div className="sp-sidebar">
                        <h2 className="sp-sidebar-title">Saved Plans</h2>
                        {loading ? (
                            <div className="loading-state"><div className="spinner-lg"></div></div>
                        ) : plans.length === 0 ? (
                            <div className="sp-empty">
                                <p>No plans yet. Click <strong>Generate</strong> to create your first AI study plan!</p>
                            </div>
                        ) : (
                            <div className="sp-plan-list">
                                {plans.map((p) => (
                                    <div key={p._id} className={`sp-plan-item ${selectedPlan?._id === p._id ? 'active' : ''}`} onClick={() => setSelectedPlan(p)}>
                                        <div className="sp-plan-info">
                                            <h3>{p.title}</h3>
                                            <p>{p.sessions?.length} sessions · {new Date(p.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deletePlan(p._id); }}>🗑️</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Plan detail */}
                    <div className="sp-detail">
                        {!selectedPlan ? (
                            <div className="sp-placeholder">
                                <div className="sp-placeholder-icon">🤖</div>
                                <h3>Select a plan or generate a new one</h3>
                                <p>StudyBuddy AI analyzes your assignments, deadlines, and priorities to create the perfect study schedule — max 6 hours/day with built-in breaks.</p>
                                <button className="btn btn-primary" onClick={generate} disabled={generating}>
                                    {generating ? 'Generating...' : '✨ Generate Now'}
                                </button>
                            </div>
                        ) : (
                            <div className="sp-plan-view">
                                <div className="sp-plan-header">
                                    <h2>{selectedPlan.title}</h2>
                                    <p>{new Date(selectedPlan.startDate).toLocaleDateString()} → {new Date(selectedPlan.endDate).toLocaleDateString()}</p>
                                </div>

                                {selectedPlan.aiGeneratedInsights && (
                                    <div className="ai-insights">
                                        <h3 className="insights-title">🤖 AI Insights</h3>
                                        <p className="insights-summary">{selectedPlan.aiGeneratedInsights.summary}</p>
                                        <div className="insights-meta">
                                            <span className="insight-chip">⏱ {selectedPlan.aiGeneratedInsights.estimatedTotalHours}h total</span>
                                            <span className="insight-chip">🎯 {selectedPlan.aiGeneratedInsights.priorityFocus}</span>
                                        </div>
                                        {selectedPlan.aiGeneratedInsights.recommendations?.length > 0 && (
                                            <ul className="insights-recs">
                                                {selectedPlan.aiGeneratedInsights.recommendations.map((r, i) => (
                                                    <li key={i}>💡 {r}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                <div className="sessions-list">
                                    {Object.entries(groupByDate(selectedPlan.sessions || [])).map(([date, sessions]) => (
                                        <div key={date} className="session-day">
                                            <h3 className="session-date">{date}</h3>
                                            {sessions.map((s, i) => (
                                                <div key={i} className="session-card">
                                                    <div className="session-time">
                                                        <span>{s.startTime}</span>
                                                        <span className="session-dur">{Math.round(s.duration / 60 * 10) / 10}h</span>
                                                    </div>
                                                    <div className="session-body">
                                                        <h4>{s.topic}</h4>
                                                        {s.description && <p className="session-desc">{s.description}</p>}
                                                        {s.tips?.length > 0 && (
                                                            <div className="session-tips">
                                                                {s.tips.map((tip, ti) => <span key={ti} className="tip-chip">💡 {tip}</span>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
