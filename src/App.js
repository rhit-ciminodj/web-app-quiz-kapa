import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './Home'
import Results from './Results'
import Leaderboard from './Leaderboard'
import Quiz from './Quiz'

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
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function Navigation() {
  return (
    <nav className="h-16 flex justify-center items-center bg-black">
      <Link to="/" className="text-white hover:text-gray-300 px-6">Home</Link>
      <Link to="/results" className="text-white hover:text-gray-300 px-6">Your Results</Link>
      <Link to="/scores" className="text-white hover:text-gray-300 px-6">Leaderboard</Link>
    </nav>
  )
}
