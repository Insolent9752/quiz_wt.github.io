document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const startButton = document.getElementById('start-button');
    const nextButton = document.getElementById('next-button');
    const restartButton = document.getElementById('restart-button');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressBar = document.getElementById('progress-bar');
    const questionNumber = document.getElementById('question-number');
    const correctAnswers = document.getElementById('correct-answers');
    const timeLeft = document.getElementById('time-left');
    const finalScore = document.getElementById('final-score');
    const timeSpent = document.getElementById('time-spent');
    const percentage = document.getElementById('percentage');
    const circleProgress = document.getElementById('circle-progress');
    const allQuestionsToggle = document.getElementById('all-questions-toggle');
    const questionsCount = document.getElementById('questions-count');
    const questionsCountInfo = document.querySelector('.questions-count-info');

    // Quiz state
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let pointsPerQuestion = 2.5;
    let passingScore = 50;
    let selectedOptionIndex = -1;
    let startTime;
    let timerInterval;
    let totalQuestions = 45;
    let useAllQuestions = false;
    let totalAvailableQuestions = 0;

    const svgNS = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(svgNS, "defs");
    const linearGradient = document.createElementNS(svgNS, "linearGradient");
    linearGradient.setAttribute("id", "gradient");
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "0%");
    linearGradient.setAttribute("x2", "100%");
    linearGradient.setAttribute("y2", "0%");

    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#6c63ff");

    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#00d4ff");

    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);

    document.querySelector('.circular-chart').insertBefore(defs, document.querySelector('.circle-bg'));

    async function fetchQuestions() {
        try {
            const gistUrl = 'https://gist.githubusercontent.com/Insolent9752/faa4904478004a8226b8bac10ef44c82/raw/5ffeca8f4166b376da05397ffa2dbf11cc008139/wt_quizz.txt';

            const response = await fetch(gistUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const text = await response.text();
            const parsedQuestions = parseQuestions(text);

            totalAvailableQuestions = parsedQuestions.length;
            updateQuestionsCountDisplay();

            return parsedQuestions;
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Не удалось загрузить вопросы. Попробуйте позже.');
            return [];
        }
    }

function parseQuestions(text) {
    const lines = text.split('\n');
    const parsedQuestions = [];

    let currentQuestion = null;
    let currentOptions = [];
    let collectingOption = false;
    let optionBuffer = "";

    for (let line of lines) {
        const trimmed = line.trim();

        // Новый вопрос
        if (trimmed.startsWith('#####1')) {
            // Сохраняем предыдущий вопрос
            if (currentQuestion && currentOptions.length > 0) {
                parsedQuestions.push({
                    question: currentQuestion,
                    options: [...currentOptions],
                    correctIndex: 0
                });
            }

            // Начинаем новый
            currentQuestion = trimmed.replace('#####1', '').trim();
            currentOptions = [];
            collectingOption = false;
            optionBuffer = "";
            continue;
        }

        // Новая опция
        if (trimmed.startsWith('?????')) {
            // Если предыдущая опция была многострочная — закрываем её
            if (optionBuffer.length > 0) {
                currentOptions.push(optionBuffer.trim());
            }

            // Начинаем новую опцию
            optionBuffer = trimmed.replace('?????', '').trim();
            collectingOption = true;
            continue;
        }

        // Продолжение многострочного ответа
        if (collectingOption) {
            // Пустые строки тоже должны учитываться как часть ответа
            optionBuffer += "\n" + trimmed;
            continue;
        }
    }

    // финальный вопрос
    if (currentQuestion && optionBuffer.length > 0) {
        currentOptions.push(optionBuffer.trim());
        parsedQuestions.push({
            question: currentQuestion,
            options: [...currentOptions],
            correctIndex: 0
        });
    }

    return parsedQuestions;
}


    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    function prepareQuiz(allQuestions) {
        const shuffledQuestions = shuffleArray([...allQuestions]);

        const selectedQuestions = useAllQuestions ?
            shuffledQuestions :
            shuffledQuestions.slice(0, totalQuestions);

        return selectedQuestions.map(q => {
            const correctOption = q.options[q.correctIndex];
            const shuffledOptions = shuffleArray([...q.options]);
            const newCorrectIndex = shuffledOptions.indexOf(correctOption);

            return {
                question: q.question,
                options: shuffledOptions,
                correctIndex: newCorrectIndex
            };
        });
    }

    function displayQuestion() {
        const question = questions[currentQuestionIndex];
        questionText.textContent = question.question;

        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.dataset.index = index;

            const optionTextSpan = document.createElement('span');
            optionTextSpan.classList.add('option-text');

            // ←←← ГЛАВНОЕ ИСПРАВЛЕНИЕ
            optionTextSpan.textContent = option;

            optionElement.appendChild(optionTextSpan);

            optionElement.addEventListener('click', function () {
                selectOption(index);
            });

            optionsContainer.appendChild(optionElement);
        });

        updateProgress();
    }

    function selectOption(index) {
        selectedOptionIndex = index;
        const options = optionsContainer.querySelectorAll('.option');

        options.forEach(option => option.classList.remove('selected'));
        options[index].classList.add('selected');
        nextButton.disabled = false;
    }

    function revealAnswer() {
        const question = questions[currentQuestionIndex];
        const options = optionsContainer.querySelectorAll('.option');

        options[question.correctIndex].classList.add('correct');

        if (selectedOptionIndex !== question.correctIndex && selectedOptionIndex !== -1) {
            options[selectedOptionIndex].classList.add('incorrect');
        }

        if (selectedOptionIndex === question.correctIndex) {
            score++;
            correctAnswers.textContent = score;
        }

        nextButton.disabled = true;
    }

    function nextQuestion() {
        nextButton.disabled = true;

        setTimeout(() => {
            currentQuestionIndex++;
            selectedOptionIndex = -1;

            if (currentQuestionIndex < questions.length) {
                displayQuestion();
            } else {
                endQuiz();
            }
        }, 500);
    }

    function updateProgress() {
        const progress = ((currentQuestionIndex) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
        questionNumber.textContent = `${currentQuestionIndex + 1}/${questions.length}`;
    }

    async function startQuiz() {
        useAllQuestions = allQuestionsToggle.checked;

        const allQuestions = await fetchQuestions();
        if (allQuestions.length === 0) return;

        questions = prepareQuiz(allQuestions);

        totalQuestions = questions.length;
        passingScore = Math.ceil(totalQuestions * pointsPerQuestion * 0.5);

        currentQuestionIndex = 0;
        score = 0;
        selectedOptionIndex = -1;
        correctAnswers.textContent = '0';

        startTime = new Date();
        startTimer();

        startScreen.classList.remove('active');
        quizScreen.classList.add('active');

        displayQuestion();
    }

    function endQuiz() {
        clearInterval(timerInterval);

        const endTime = new Date();
        const elapsed = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const totalPoints = score * pointsPerQuestion;
        const isPassing = totalPoints >= passingScore;

        finalScore.textContent = `${score}/${questions.length} (${totalPoints} баллов)`;
        timeSpent.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const percent = Math.round((score / questions.length) * 100);
        percentage.textContent = `${percent}%`;
        circleProgress.setAttribute('stroke-dasharray', `${percent}, 100`);

        const resultMessage = document.getElementById('result-message');
        if (resultMessage) {
            resultMessage.textContent = isPassing ? 'Тест пройден!' : `Тест не пройден. Нужно минимум ${passingScore} баллов.`;
            resultMessage.className = isPassing ? 'result-message success' : 'result-message failure';
        }

        quizScreen.classList.remove('active');
        resultsScreen.classList.add('active');
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            const currentTime = new Date();
            const elapsed = Math.floor((currentTime - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            timeLeft.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function updateQuestionsCountDisplay() {
        const newCount = useAllQuestions ? totalAvailableQuestions : 45;

        questionsCountInfo.classList.add('animate');

        setTimeout(() => {
            questionsCount.textContent = newCount;
        }, 400);

        setTimeout(() => {
            questionsCountInfo.classList.remove('animate');
        }, 800);

        questionNumber.classList.add('animate');

        setTimeout(() => {
            questionNumber.textContent = `0/${newCount}`;
        }, 400);

        setTimeout(() => {
            questionNumber.classList.remove('animate');
        }, 800);
    }

    startButton.addEventListener('click', startQuiz);

    nextButton.addEventListener('click', () => {
        nextButton.disabled = true;

        revealAnswer();

        setTimeout(() => {
            nextQuestion();
        }, 1500);
    });

    restartButton.addEventListener('click', () => {
        resultsScreen.classList.remove('active');
        startScreen.classList.add('active');
    });

    allQuestionsToggle.addEventListener('change', function () {
        useAllQuestions = this.checked;
        updateQuestionsCountDisplay();
    });

    fetchQuestions();

    const elementsToAnimate = document.querySelectorAll('.screen, .option, .neo-button');
    elementsToAnimate.forEach(element => {
        element.classList.add('fade-in');
    });
});