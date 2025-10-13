import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const startQuiz = () => {
        navigate('/quiz');
    };

    const [categories, setData] = React.useState(null);

    React.useEffect(() => {
        // fetch categories once on mount
        fetch('https://opentdb.com/api_category.php')
            .then((response) => response.json())
            .then((json) => setData(json))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    const [display, setDisplay] = React.useState(false);

    function handleClick() {
        setDisplay(!display);
    }

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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleClick();
                            }
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
                    >
                        {display ? 'Hide Categories' : 'Show Categories'}
                    </button>
                </div>

                <div id="categories-list" className={`${display ? 'block' : 'hidden'} mt-3`}>
                    {categories ? (
                        <ul>
                            {categories.trivia_categories.map((category) => (
                                <li key={category.id} className="mb-1">
                                    {category.name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Loading categories...</p>
                    )}
                </div>
            </div>
            <button
                onClick={startQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
                Start Quiz
            </button>
        </div>
    );
};

export default Home;