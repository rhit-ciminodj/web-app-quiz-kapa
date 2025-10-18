import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const startQuiz = (categoryId) => {
        const params = new URLSearchParams();
        if (categoryId) params.set('category', categoryId);
        if (difficulty && difficulty !== 'any') params.set('difficulty', difficulty);
        if (amount) params.set('amount', amount);
        const query = params.toString();
        const url = query ? `/quiz?${query}` : '/quiz';
        navigate(url);
    };


    const [categories, setCategories] = React.useState([]);

    React.useEffect(() => {
        // fetch categories once on mount
        fetch('https://opentdb.com/api_category.php')
            .then((response) => response.json())
            .then((json) => setCategories(json.trivia_categories || []))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    // session token is managed automatically by the Quiz page; Home does not expose it

    const [display, setDisplay] = React.useState(false);
    const [difficulty, setDifficulty] = React.useState('any');
    const [amount, setAmount] = React.useState(10);

    function handleClick() {
        setDisplay(!display);
    }

    // pick a random category id and start quiz; fallback to random quiz when none
    const startRandomQuiz = () => {
        if (!Array.isArray(categories) || categories.length === 0) {
            startQuiz(); // no categories yet — start a random quiz
            return;
        }
        const randomIndex = Math.floor(Math.random() * categories.length);
        const randomCategory = categories[randomIndex];
        // pass difficulty and amount through startQuiz
        startQuiz(randomCategory?.id);
    };

    return (
        <div className="container mx-auto text-center mt-20 px-4">
            <h1 className="text-3xl font-bold mb-4">Welcome to Quizi!</h1>
            <p className="mb-6">Test your knowledge with our a variety of different quizzes.</p>
            <div className="mb-6 text-left">
                <h2 className="text-xl font-semibold mb-2">Available Categories</h2>

                <div>
                    <button
                        type="button"
                        aria-expanded={display}
                        aria-controls="categories-list"
                        onClick={handleClick}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
                    >
                        {display ? 'Hide Categories' : 'Show Categories'}
                    </button>
                </div>

                <div id="categories-list" className={`${display ? 'block' : 'hidden'} mt-3`}>
                    {categories.length > 0 ? (
                        <ul>
                            {categories.map((category) => (
                                <li key={category.id} className="mb-1">
                                    {category.name}
                                    <button onClick={() => startQuiz(category.id)} className="ml-2 bg-blue-500 hover:bg-blue-600 text-white py-0.5 px-2 rounded text-sm">Start Quiz in this Category</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Loading categories...</p>
                    )}
                </div>
                <div className="mt-4">
                    <label className="block mb-1">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border rounded py-1 px-2">
                        <option value="any">Any</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>

                    <label className="block mt-3 mb-1">Number of questions (1-50)</label>
                    <input
                        type="number"
                        min={1}
                        max={50}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="border rounded py-1 px-2 w-24"
                    />
                </div>
                {/* token is handled automatically; not shown here */}
            </div>
            <button
                onClick={startRandomQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
                Start Random Quiz
            </button>
        </div>
    );
};

export default Home;