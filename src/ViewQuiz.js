import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export default function ViewQuiz() {
  const { slug } = useParams();
  const [quiz, setQuiz] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Check for payload in location.state first (from CreateQuiz), otherwise check URL hash (base64url)
    setLoading(true); setError(null);
    if (location.state && location.state.payload) {
      setQuiz(location.state.payload);
      setLoading(false);
      return;
    }
    const hash = window.location.hash ? window.location.hash.replace('#', '') : null;
    if (hash) {
      try {
        const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(escape(atob(b64)));
        const obj = JSON.parse(json);
        setQuiz(obj);
      } catch (e) {
        setError('Failed to decode quiz payload');
      } finally { setLoading(false); }
      return;
    }
    // if slug present, we can't fetch from server anymore; show an error
    if (slug) {
      setError('This app is running frontend-only; server-backed quizzes are not available.');
    }
    setLoading(false);
  }, [slug, location.state]);

  if (loading) return <div className="container mx-auto mt-8 px-4">Loading…</div>;
  if (error) return <div className="container mx-auto mt-8 px-4 text-red-600">{error}</div>;
  if (!quiz) return <div className="container mx-auto mt-8 px-4">No quiz payload provided. Create one first.</div>;

  return (
    <div>
      <div className="container mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>
        <p className="mb-4">{quiz.description}</p>
      </div>
      <div className="container mx-auto px-4">
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => navigate('/quiz', { state: { quizPayload: quiz } })}>Take Quiz</button>
      </div>
    </div>
  );
}
