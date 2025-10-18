import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Results({ score: propScore, totalQuestions: propTotal, onRestart: propRestart }) {
    const { state } = useLocation();
    const navigate = useNavigate();
    const score = state?.score ?? propScore ?? 0;
    const total = state?.totalQuestions ?? propTotal ?? 0;

    const handleRestart = () => {
        if (typeof propRestart === 'function') return propRestart();
        // navigate back to home to start a new quiz
        navigate('/');
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Quiz Results</h2>
            <p>
                You scored {score} out of {total}
            </p>
            <button onClick={handleRestart}>Restart Quiz</button>
        </div>
    );
}

export default Results;