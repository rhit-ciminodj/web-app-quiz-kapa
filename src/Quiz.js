import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = React.useState([]);
  const [prepared, setPrepared] = React.useState([]); // questions with choices
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastUrl, setLastUrl] = React.useState('');
  const [retryHints, setRetryHints] = React.useState({ canRetryWithoutCategory: false, canRetryWithoutDifficulty: false });
  const [rateLimit, setRateLimit] = React.useState({ retrying: false, attempts: 0, nextDelay: 0 });
  const retryTimerRef = React.useRef(null);
  const retryLoopRef = React.useRef(false);
  const cancelRetryRef = React.useRef(false);
  const countdownRef = React.useRef(null);
  const [timeLeft, setTimeLeft] = React.useState(null); // seconds
  const preparedRef = React.useRef([]);
  // helper: compute score with partial credit for hinted questions
  function computeScoreFromPrepared(arr) {
    return arr.reduce((acc, q) => {
      if (typeof q._selectedIndex !== 'number') return acc;
      const selected = q.choices[q._selectedIndex];
      const correct = q.correct_answer;
      if (selected !== correct) return acc;
      return acc + (q._hintUsed ? 0.5 : 1);
    }, 0);
  }
  const [token, setToken] = React.useState(() => {
    try { return localStorage.getItem('opentdb_token') || null; } catch (e) { return null; }
  });
  const requestingTokenRef = React.useRef(false);

  const params = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  // sanitize amount
  const rawAmount = params.get('amount');
  let amount = 10;
  if (rawAmount) {
    const n = parseInt(rawAmount, 10);
    if (!Number.isNaN(n)) amount = Math.max(1, Math.min(50, n));
  }

  const category = params.get('category');
  const difficulty = params.get('difficulty');
  // token is handled internally; query param not used for token anymore

  const fetchQuestions = React.useCallback(
    async ({ useCategory = true, useDifficulty = true, overrideAmount } = {}) => {
      setLoading(true);
      setError(null);
      setQuestions([]);

  const apiParams = new URLSearchParams();
      apiParams.set('amount', overrideAmount ? String(overrideAmount) : String(amount));
      if (useCategory && category) apiParams.set('category', category);
      if (useDifficulty && difficulty && difficulty !== 'any') apiParams.set('difficulty', difficulty);
  if (token) apiParams.set('token', token);
      apiParams.set('type', 'multiple');

      const url = `https://opentdb.com/api.php?${apiParams.toString()}`;
      setLastUrl(url);
      try {
        // debug
        // console.debug('Fetching questions from', url);
        const res = await fetch(url);
        const data = await res.json();
        if (!data || typeof data.response_code === 'undefined') {
          setError('Unexpected API response');
          setRetryHints({ canRetryWithoutCategory: !!category, canRetryWithoutDifficulty: !!difficulty });
          return;
        }
  if (data.response_code !== 0) {
          // provide useful guidance based on response code
          let message = `OpenTDB returned response_code ${data.response_code}.`;
          switch (data.response_code) {
            case 1:
              message += ' No results - try a different amount, category or difficulty.';
              break;
            case 2:
              message += ' Invalid parameter - check your query parameters.';
              break;
            case 5:
              // Rate limit - start a retry loop that keeps trying until success or cancel
              if (!retryLoopRef.current) {
                retryLoopRef.current = true;
                cancelRetryRef.current = false;
                (async () => {
                  let attempts = 1;
                  while (!cancelRetryRef.current) {
                    const nextDelay = Math.min(30, Math.pow(2, attempts));
                    setRateLimit({ retrying: true, attempts, nextDelay });
                    await new Promise((res) => { retryTimerRef.current = setTimeout(res, nextDelay * 1000); });
                    if (cancelRetryRef.current) break;
                    // build URL same as fetchQuestions
                    const apiParamsRetry = new URLSearchParams();
                    apiParamsRetry.set('amount', overrideAmount ? String(overrideAmount) : String(amount));
                    if (useCategory && category) apiParamsRetry.set('category', category);
                    if (useDifficulty && difficulty && difficulty !== 'any') apiParamsRetry.set('difficulty', difficulty);
                    if (token) apiParamsRetry.set('token', token);
                    apiParamsRetry.set('type', 'multiple');
                    const urlRetry = `https://opentdb.com/api.php?${apiParamsRetry.toString()}`;
                    setLastUrl(urlRetry);
                    try {
                      const res = await fetch(urlRetry);
                      const dataRetry = await res.json();
                      if (dataRetry && dataRetry.response_code === 0) {
                        // success: process results and stop retrying
                        const got = dataRetry.results || [];
                        setQuestions(got);
                        const preparedQs2 = got.map((q) => {
                          const choices = [...(q.incorrect_answers || [])];
                          choices.push(q.correct_answer);
                          for (let i = choices.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [choices[i], choices[j]] = [choices[j], choices[i]];
                          }
                          return { ...q, choices, _hintUsed: false, _eliminated: [] };
                        });
                        setPrepared(preparedQs2);
                        // ensure preparedRef is current and start the countdown like the main fetch path
                        preparedRef.current = preparedQs2;
                        // start 5-minute timer (300s) when questions are ready
                        setTimeLeft(300);
                        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
                        countdownRef.current = setInterval(() => {
                          setTimeLeft((t) => {
                            if (typeof t !== 'number') return t;
                            if (t <= 1) {
                              // time's up: auto-submit using the latest prepared state
                              clearInterval(countdownRef.current);
                              countdownRef.current = null;
                              const latest = preparedRef.current || [];
                              const correctNow = computeScoreFromPrepared(latest);
                              try {
                                const prev = JSON.parse(localStorage.getItem('quiz_results') || '[]');
                                const entry = {
                                  id: Date.now(),
                                  score: correctNow,
                                  total: latest.length,
                                  categoryId: category || null,
                                  categoryName: latest[0]?.category || 'Any',
                                  difficulty: difficulty || 'any',
                                  timestamp: Date.now(),
                                };
                                prev.push(entry);
                                localStorage.setItem('quiz_results', JSON.stringify(prev));
                              } catch (e) {}
                              navigate('/results', { state: { score: correctNow, totalQuestions: latest.length } });
                              return 0;
                            }
                            return t - 1;
                          });
                        }, 1000);
                        retryLoopRef.current = false;
                        cancelRetryRef.current = false;
                        setRateLimit({ retrying: false, attempts: 0, nextDelay: 0 });
                        if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
                        break;
                      } else if (dataRetry && dataRetry.response_code === 4) {
                        // token empty: reset and continue
                        const t = token;
                        if (t) fetch(`https://opentdb.com/api_token.php?command=reset&token=${t}`).catch(() => {});
                        localStorage.removeItem('opentdb_token');
                        setToken(null);
                      }
                    } catch (e) {
                      // ignore and continue retrying
                    }
                    attempts += 1;
                  }
                  // cleanup
                  if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
                  retryLoopRef.current = false;
                  setRateLimit({ retrying: false, attempts: 0, nextDelay: 0 });
                })();
              }
              // don't set a user-visible error; we'll show Loading UI instead
              break;
            case 3:
              message += ' Token not found.';
              break;
            case 4:
              // Token Empty: reset the token then retry automatically
              try {
                const t = token;
                if (t) {
                  fetch(`https://opentdb.com/api_token.php?command=reset&token=${t}`).catch(() => {});
                }
                localStorage.removeItem('opentdb_token');
                setToken(null);
                requestingTokenRef.current = false;
              } catch (e) {}
              break;
            default:
              break;
          }
          // For rate limit we avoid setting an error. For other codes show message.
          if (data.response_code !== 5) {
            setError(message);
            setRetryHints({ canRetryWithoutCategory: !!category, canRetryWithoutDifficulty: !!difficulty });
          } else {
            setError(null);
          }
          return;
        }
        const got = data.results || [];
        setQuestions(got);
        // prepare choices: shuffle correct + incorrect
        const preparedQs = got.map((q) => {
          const choices = [...(q.incorrect_answers || [])];
          choices.push(q.correct_answer);
          // simple shuffle
          for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
          }
          return { ...q, choices, _hintUsed: false, _eliminated: [] };
        });
  setPrepared(preparedQs);
  preparedRef.current = preparedQs;
        // start 5-minute timer (300s) when questions are ready
        setTimeLeft(300);
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        countdownRef.current = setInterval(() => {
          setTimeLeft((t) => {
            if (typeof t !== 'number') return t;
            if (t <= 1) {
              // time's up: auto-submit using the latest prepared state
              clearInterval(countdownRef.current);
              countdownRef.current = null;
              const latest = preparedRef.current || [];
              const correctNow = computeScoreFromPrepared(latest);
              try {
                const prev = JSON.parse(localStorage.getItem('quiz_results') || '[]');
                const entry = {
                  id: Date.now(),
                  score: correctNow,
                  total: latest.length,
                  categoryId: category || null,
                  categoryName: latest[0]?.category || 'Any',
                  difficulty: difficulty || 'any',
                  timestamp: Date.now(),
                };
                prev.push(entry);
                localStorage.setItem('quiz_results', JSON.stringify(prev));
              } catch (e) {}
              navigate('/results', { state: { score: correctNow, totalQuestions: latest.length } });
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } catch (err) {
        setError(err.message || 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    },
    [amount, category, difficulty, token, navigate]
  );

  React.useEffect(() => {
    // If a quizPayload was passed via navigation state, use it instead of fetching from OpenTDB
    if (location && location.state && location.state.quizPayload) {
      const payload = location.state.quizPayload;
      const got = payload.questions || [];
      setQuestions(got);
      const preparedQs = got.map((q) => {
        const choices = [...(q.choices || [])];
        return { ...q, choices };
      });
      setPrepared(preparedQs);
      preparedRef.current = preparedQs;
      // start timer
      setTimeLeft(300);
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      countdownRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (typeof t !== 'number') return t;
            if (t <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            const latest = preparedRef.current || [];
            const correctNow = computeScoreFromPrepared(latest);
            try {
              const prev = JSON.parse(localStorage.getItem('quiz_results') || '[]');
              const entry = {
                id: Date.now(),
                score: correctNow,
                total: latest.length,
                categoryId: null,
                categoryName: payload.title || 'Custom',
                difficulty: 'custom',
                timestamp: Date.now(),
              };
              prev.push(entry);
              localStorage.setItem('quiz_results', JSON.stringify(prev));
            } catch (e) {}
            navigate('/results', { state: { score: correctNow, totalQuestions: latest.length } });
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      setLoading(false);
      return;
    }
    fetchQuestions();
  }, [fetchQuestions, location, navigate]);

  // request a token if missing, once per mount
  React.useEffect(() => {
    if (token || requestingTokenRef.current) return;
    requestingTokenRef.current = true;
    fetch('https://opentdb.com/api_token.php?command=request')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.response_code === 0 && d.token) {
          try { localStorage.setItem('opentdb_token', d.token); } catch (e) {}
          setToken(d.token);
        }
      })
      .catch(() => {})
      .finally(() => { requestingTokenRef.current = false; });
  }, [token]);

  // NOTE: automatic retry scheduling is handled inside fetchQuestions when a rate-limit (code 5) is returned.

  // cleanup on unmount
  React.useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // finish handled by navigating with state to /results

  return (
    <div className="container mx-auto mt-8 px-4 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Quiz</h2>
        {prepared.length > 0 && timeLeft != null && (
          <div className="text-blue-700 font-mono">{Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
        )}
      </div>

      {loading ? (
        <p>Loading questions…</p>
      ) : rateLimit.retrying ? (
        <div>
          <p>Loading Quiz… (rate limited, retrying in {rateLimit.nextDelay}s)</p>
          <div className="mt-4 space-x-2">
            <button onClick={() => { if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; } cancelRetryRef.current = false; /* allow loop to continue and retry immediately by setting attempts low */ fetchQuestions(); setRateLimit({ retrying: false, attempts: 0, nextDelay: 0 }); }} className="bg-blue-500 py-1 px-3 rounded">Retry now</button>
            <button onClick={() => { if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; } cancelRetryRef.current = true; setRateLimit({ retrying: false, attempts: 0, nextDelay: 0 }); }} className="bg-gray-300 py-1 px-3 rounded">Cancel</button>
          </div>
        </div>
      ) : error ? (
        <div>
          <p className="text-red-600">{error}</p>
          {lastUrl && (
            <p className="text-sm break-all mt-2">API URL: <code>{lastUrl}</code></p>
          )}
          <div className="mt-4 space-x-2">
            {retryHints.canRetryWithoutCategory && (
              <button onClick={() => fetchQuestions({ useCategory: false })} className="bg-yellow-400 py-1 px-3 rounded">Retry without category</button>
            )}
            {retryHints.canRetryWithoutDifficulty && (
              <button onClick={() => fetchQuestions({ useDifficulty: false })} className="bg-yellow-400 py-1 px-3 rounded">Retry without difficulty</button>
            )}
            {token && (
              <button onClick={() => {
                // call reset token endpoint then retry
                fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`)
                  .then((r) => r.json())
                  .then((d) => {
                    // if reset succeeded (response_code 0), clear localStorage token and retry
                    if (d && d.response_code === 0) {
                      try { localStorage.removeItem('opentdb_token'); } catch (e) {}
                      setToken(null);
                      fetchQuestions();
                    } else {
                      setError('Failed to reset token');
                    }
                  }).catch((e) => setError(e.message || 'Failed to reset token'));
              }} className="bg-orange-400 py-1 px-3 rounded">Reset Token</button>
            )}
            <button onClick={() => navigate('/')} className="bg-gray-200 py-1 px-3 rounded">Back</button>
          </div>
        </div>
      ) : (
        <div>
          {questions.length > 0 && (
            <p className="text-blue-700 mb-3">Loaded {questions.length} question(s).</p>
          )}
          <div className="space-y-4">
            {prepared.map((q, i) => (
              <div key={i} className="bg-gray-900 p-4 rounded border border-gray-800">
                <div className="mb-2 text-white font-medium" dangerouslySetInnerHTML={{ __html: q.question }} />
                <div className="grid gap-2">
                  {q.choices.map((choice, ci) => {
                    const selected = q._selectedIndex === ci;
                    const isCorrect = q.correct_answer === choice;
                    const reveal = typeof q._selectedIndex === 'number';
                    const eliminated = Array.isArray(q._eliminated) && q._eliminated.includes(ci);
                    const disabled = eliminated;
                    const base = reveal ? (isCorrect ? 'bg-green-600 text-white' : (selected ? 'bg-red-600 text-white' : 'bg-gray-800 text-blue-100')) : (eliminated ? 'bg-gray-700 text-gray-400 line-through' : 'bg-gray-800 text-blue-100');
                    return (
                      <button
                        key={ci}
                        className={`${base} w-full text-left border border-gray-700 rounded py-2 px-3`}
                        onClick={() => {
                          if (disabled) return;
                          // mark selection immutably
                          setPrepared((prev) => {
                            const copy = prev.slice();
                            copy[i] = { ...copy[i], _selectedIndex: ci };
                            preparedRef.current = copy;
                            return copy;
                          });
                        }}
                        dangerouslySetInnerHTML={{ __html: choice }}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-400">{q._hintUsed ? 'Hint used (-50%)' : ''}</div>
                  <div>
                    {/* only allow hint if not yet used AND the question hasn't been answered */}
                    {!q._hintUsed && typeof q._selectedIndex !== 'number' && (
                      <button className="bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded" onClick={() => {
                        // eliminate two wrong answers
                        setPrepared((prev) => {
                          const copy = prev.slice();
                          const cur = copy[i];
                          const incorrectIndexes = cur.choices.map((c, idx) => ({ c, idx })).filter(x => x.c !== cur.correct_answer).map(x => x.idx);
                          // pick two random incorrect indexes to eliminate
                          const shuffled = incorrectIndexes.slice().sort(() => 0.5 - Math.random());
                          const toElim = shuffled.slice(0, Math.min(2, shuffled.length));
                          copy[i] = { ...cur, _hintUsed: true, _eliminated: toElim };
                          preparedRef.current = copy;
                          return copy;
                        });
                      }}>Use Hint</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => {
              // compute score with partial credit for hints
              const correct = computeScoreFromPrepared(prepared);
              const total = prepared.length;
              // persist result to localStorage
              try {
                const prev = JSON.parse(localStorage.getItem('quiz_results') || '[]');
                const entry = {
                  id: Date.now(),
                  score: correct,
                  total,
                  categoryId: category || null,
                  categoryName: prepared[0]?.category || 'Any',
                  difficulty: difficulty || 'any',
                  timestamp: Date.now(),
                };
                prev.push(entry);
                localStorage.setItem('quiz_results', JSON.stringify(prev));
              } catch (e) {
                // ignore storage errors
              }
              // navigate to results page with state
              navigate('/results', { state: { score: correct, totalQuestions: total } });
            }} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded">Finish Quiz</button>
          </div>
        </div>
      )}
    </div>
  );
}
