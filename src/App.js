import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './Home'
import Results from './Results'
import Leaderboard from './Leaderboard'
import Quiz from './Quiz'
import ViewQuiz from './ViewQuiz'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/results" element={<Results />} />
            <Route path="/scores" element={<Leaderboard />} />
            <Route path="/view/:slug" element={<ViewQuiz />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function Navigation() {
  return (
    <nav className="h-16 flex items-center justify-between bg-black px-6">
      <div className="flex items-center gap-4">
        <div className="text-white font-bold text-lg">Quizi</div>
        <Link to="/" className="text-blue-300 hover:text-blue-400 px-3">Home</Link>
        <Link to="/scores" className="text-blue-300 hover:text-blue-400 px-3">Your High Scores</Link>
      </div>
      <div className="text-sm text-gray-400">Test Your knowledge!</div>
    </nav>
  )
}
