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
        <div className="container mx-auto mt-10 px-4 max-w-3xl">
            <h1 className="text-2xl font-bold text-white mb-4">Your High Scores</h1>

            {['easy', 'medium', 'hard'].map((diff) => {
                const entries = Object.values(byDifficulty[diff] || {});
                return (
                    <div key={diff} className="mb-4 bg-gray-900 p-3 rounded border border-gray-800">
                        <button onClick={() => setOpen((s) => ({ ...s, [diff]: !s[diff] }))} className="w-full text-left text-blue-700 font-semibold">
                            {diff.charAt(0).toUpperCase() + diff.slice(1)} ({entries.length}) {open[diff] ? '▲' : '▼'}
                        </button>
                        {open[diff] && (
                            <div className="mt-3">
                                {entries.length === 0 ? (
                                    <p className="text-gray-400">No scores for {diff} yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {entries.map((e) => (
                                            <div key={e.categoryId} className="flex justify-between text-blue-700">
                                                <div>{decodeHtmlEntities(e.categoryName)}</div>
                                                <div className="text-gray-300">{e.score} / {e.total}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}