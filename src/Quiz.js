import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Quiz() {
  const navigate = useNavigate();
  const finish = () => navigate('/results');

  return (
    <div className="container mx-auto mt-10 px-4">
      <h2 className="text-2xl font-bold mb-4">Quiz (placeholder)</h2>
      <p>This is a placeholder for the quiz. Implement questions here.</p>
      <button onClick={finish} className="mt-6 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
        Finish Quiz
      </button>
    </div>
  );
}
