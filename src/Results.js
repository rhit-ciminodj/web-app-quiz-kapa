import React from 'react';

function Results({ score, totalQuestions, onRestart }) {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Quiz Results</h2>
            <p>
                You scored {score} out of {totalQuestions}
            </p>
            <button onClick={onRestart}>Restart Quiz</button>
        </div>
    );
}

export default Results;