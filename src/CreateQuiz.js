import React from 'react';
import { useNavigate } from 'react-router-dom';

function emptyQuestion() {
  return { text: '', choices: ['', ''], correctIndex: 0 };
}

export default function CreateQuiz() {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [questions, setQuestions] = React.useState([emptyQuestion()]);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  function updateQuestion(idx, patch) {
    setQuestions((prev) => {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function addChoice(qi) {
    setQuestions((prev) => {
      const copy = prev.slice();
      copy[qi] = { ...copy[qi], choices: [...copy[qi].choices, ''] };
      return copy;
    });
  }

  function removeChoice(qi, ci) {
    setQuestions((prev) => {
      const copy = prev.slice();
      const c = copy[qi].choices.slice();
      c.splice(ci, 1);
      copy[qi] = { ...copy[qi], choices: c, correctIndex: Math.min(copy[qi].correctIndex, c.length - 1) };
      return copy;
    });
  }

  function addQuestion() {
    setQuestions((p) => [...p, emptyQuestion()]);
  }

  function removeQuestion(i) {
    setQuestions((p) => p.filter((_, idx) => idx !== i));
  }

  async function publish() {
    setError(null);
    if (!title.trim()) return setError('Title is required');
    setPublishing(true);
    try {
      const payload = { title, description, questions };
      const json = JSON.stringify(payload);
      // base64url encode
      const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      // navigate to view route with hash payload
      const url = `${window.location.origin}/view#${b64}`;
      // copy to clipboard and navigate to /view with state
      try { await navigator.clipboard.writeText(url); } catch (_) {}
      navigate(`/view`, { state: { payload } });
      // also set location so user can share the link
      window.history.replaceState({}, '', `/view#${b64}`);
    } catch (e) {
      setError(e.message || String(e));
    } finally { setPublishing(false); }
  }

  return (
    <div className="container mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold mb-4">Create Quizzes</h2>
      <div className="mb-2">
        <label className="block">Title</label>
        <input className="border p-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="block">Description</label>
        <textarea className="border p-1 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        {questions.map((q, i) => (
          <div key={i} className="mb-4 border p-3 rounded">
            <div className="flex justify-between items-center">
              <strong>Question {i + 1}</strong>
              <div>
                <button className="bg-red-400 text-white px-2 rounded" onClick={() => removeQuestion(i)}>Remove</button>
              </div>
            </div>
            <div className="mt-2">
              <input className="border p-1 w-full" placeholder="Question text" value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} />
            </div>
            <div className="mt-2">
              <label className="block">Choices</label>
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2 mt-1">
                  <input type="radio" name={`correct-${i}`} checked={q.correctIndex === ci} onChange={() => updateQuestion(i, { correctIndex: ci })} />
                  <input className="border p-1 flex-1" value={c} onChange={(e) => {
                    const nx = q.choices.slice(); nx[ci] = e.target.value; updateQuestion(i, { choices: nx });
                  }} />
                  {q.choices.length > 2 && <button className="bg-gray-300 px-2 rounded" onClick={() => removeChoice(i, ci)}>x</button>}
                </div>
              ))}
              <div className="mt-2">
                <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => addChoice(i)}>Add Choice</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button className="bg-gray-200 px-3 py-1 rounded mr-2" onClick={addQuestion}>Add Question</button>
        <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={publish} disabled={publishing}>{publishing ? 'Publishing…' : 'Publish & Share'}</button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
