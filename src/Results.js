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
        <div className="container mx-auto mt-20 px-4 max-w-xl text-center bg-gray-900 p-6 rounded border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-3">Quiz Results</h2>
            <p className="text-blue-700 mb-4">You scored <span className="font-semibold text-white">{score}</span> out of <span className="font-semibold text-white">{total}</span></p>
            <button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">Restart Quiz</button>
        </div>
    );
}

export default Results;