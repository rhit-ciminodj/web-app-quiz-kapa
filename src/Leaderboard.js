import React from 'react';
import PropTypes from 'prop-types';

const Leaderboard = ({ scores }) => {
    const list = Array.isArray(scores) ? scores : [];

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Leaderboard</h1>

            {list.length === 0 ? (
                <p style={{ marginTop: 16 }}>No scores yet. Be the first to finish the quiz!</p>
            ) : (
                <table style={{ margin: '0 auto', borderCollapse: 'collapse', minWidth: '300px' }}>
                    <thead>
                        <tr>
                            <th style={{ borderBottom: '2px solid #ccc', padding: '8px' }}>Rank</th>
                            <th style={{ borderBottom: '2px solid #ccc', padding: '8px' }}>Name</th>
                            <th style={{ borderBottom: '2px solid #ccc', padding: '8px' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((entry, idx) => (
                            <tr key={entry?.id ?? entry?.name ?? idx}>
                                <td style={{ padding: '8px' }}>{idx + 1}</td>
                                <td style={{ padding: '8px' }}>{entry?.name ?? '—'}</td>
                                <td style={{ padding: '8px' }}>{entry?.score ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

Leaderboard.propTypes = {
    scores: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            name: PropTypes.string,
            score: PropTypes.number,
        })
    ),
};

Leaderboard.defaultProps = {
    scores: [],
};

export default Leaderboard;