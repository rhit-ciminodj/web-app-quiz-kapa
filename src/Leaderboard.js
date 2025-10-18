import React from 'react';

function groupTopScores(results = []) {
    // results: [{ categoryId, categoryName, difficulty, score, total, timestamp }]
    const byDifficulty = { easy: {}, medium: {}, hard: {} };
    results.forEach((r) => {
        const d = (r.difficulty || 'any').toLowerCase();
        if (!['easy', 'medium', 'hard'].includes(d)) return; // skip 'any'
        const cat = r.categoryId || 'any';
        const name = r.categoryName || 'Any';
        const prev = byDifficulty[d][cat];
        // keep top score (higher raw score) or newer if same
        if (!prev || r.score > prev.score || (r.score === prev.score && r.timestamp > prev.timestamp)) {
            byDifficulty[d][cat] = { categoryId: cat, categoryName: name, score: r.score, total: r.total, timestamp: r.timestamp };
        }
    });
    return byDifficulty;
}

function decodeHtmlEntities(str) {
    if (!str || typeof str !== 'string') return str;
    // Use browser DOM to decode HTML entities
    try {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
    } catch (e) {
        return str.replace(/&amp;/g, '&');
    }
}

export default function Leaderboard() {
    const [results, setResults] = React.useState(() => {
        try {
            const raw = JSON.parse(localStorage.getItem('quiz_results') || '[]');
            // decode category names
            return raw.map((r) => ({ ...r, categoryName: decodeHtmlEntities(r.categoryName) }));
        } catch (e) {
            return [];
        }
    });
    const [open, setOpen] = React.useState({ easy: false, medium: false, hard: false });

    React.useEffect(() => {
        const onStorage = () => {
            try { setResults(JSON.parse(localStorage.getItem('quiz_results') || '[]')); } catch (e) { setResults([]); }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const byDifficulty = groupTopScores(results);

        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>Your High Scores</h1>

            {['easy', 'medium', 'hard'].map((diff) => {
                const entries = Object.values(byDifficulty[diff] || {});
                return (
                    <div key={diff} style={{ maxWidth: 720, margin: '20px auto', textAlign: 'left' }}>
                        <button onClick={() => setOpen((s) => ({ ...s, [diff]: !s[diff] }))} className="bg-gray-200 py-1 px-3 rounded">
                            {diff.charAt(0).toUpperCase() + diff.slice(1)} ({entries.length}) {open[diff] ? '▲' : '▼'}
                        </button>
                        {open[diff] && (
                            <div style={{ marginTop: 10 }}>
                                {entries.length === 0 ? (
                                    <p>No scores for {diff} yet.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Category</th>
                                                <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Top Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                                                    {entries.map((e) => (
                                                                        <tr key={e.categoryId}>
                                                                            <td style={{ padding: 8 }}>{decodeHtmlEntities(e.categoryName)}</td>
                                                                            <td style={{ padding: 8, textAlign: 'right' }}>{e.score} / {e.total}</td>
                                                                        </tr>
                                                                    ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}