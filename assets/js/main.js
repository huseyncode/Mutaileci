document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions();
    startTimer(); // Start the timer when the page loads
});

let currentPlayerIndex = 0;
let currentRoundIndex = 0;
let currentQuestionIndex = 0;
const players = 6;
const questionsPerRound = 5;
let shieldActive = false;
let shieldUsed = false;
let timerInterval;
let timeLeft = 120; // 2 minutes = 120 seconds
let currentQuestionData;
let playerEliminated = false;

function fetchQuestions() {
    fetch('./assets/db/db.json')
        .then(response => response.json())
        .then(data => {
            const rounds = data.rounds;
            const audienceQuestions = data.audience_questions;

            displayQuestion(rounds, audienceQuestions);
            
            document.querySelector('.next-question').addEventListener('click', () => {
                if (playerEliminated) {
                    displayAudienceQuestion(audienceQuestions);
                    playerEliminated = false;
                } else {
                    currentQuestionIndex++;
                    if (currentQuestionIndex < questionsPerRound) {
                        displayQuestion(rounds, audienceQuestions);
                    } else {
                        currentQuestionIndex = 0;
                        currentRoundIndex++;
                        if (currentRoundIndex < 3) {
                            displayQuestion(rounds, audienceQuestions);
                        } else {
                            currentRoundIndex = 0;
                            currentPlayerIndex++;
                            if (currentPlayerIndex < players) {
                                resetJokers(); // Reset jokers for the next player
                                displayQuestion(rounds, audienceQuestions);
                            } else {
                                displayAudienceQuestion(audienceQuestions);
                            }
                        }
                    }
                }
            });

            // Joker buttons
            document.querySelector('.joker .btn:nth-child(1)').addEventListener('click', () => use5050Joker());
            document.querySelector('.joker .btn:nth-child(2)').addEventListener('click', () => usePassJoker(rounds, audienceQuestions));
            document.querySelector('.joker .btn:nth-child(3)').addEventListener('click', () => useShieldJoker());
        })
        .catch(error => console.error('Error fetching questions:', error));
}

function displayQuestion(rounds, audienceQuestions) {
    resetTimer(); // Reset the timer for each question
    const round = rounds[`round_${currentRoundIndex + 1}`];
    currentQuestionData = round[currentQuestionIndex];
    const questionElement = document.querySelector('.question h1');
    const answerButtons = document.querySelectorAll('.answer button');
    const playerNameElement = document.getElementById('playerName');
    const roundInfoElement = document.getElementById('roundInfo');

    playerNameElement.textContent = `Player ${currentPlayerIndex + 1}`;
    roundInfoElement.textContent = `Round ${currentRoundIndex + 1}`;

    questionElement.textContent = currentQuestionData.question;
    answerButtons.forEach((button, index) => {
        button.textContent = currentQuestionData.options[index] || '';
        button.classList.remove('active', 'used'); // Reset button classes
        button.style.backgroundColor = ''; // Reset button color
        button.style.visibility = 'visible'; // Ensure button is visible
        button.disabled = false; // Enable button

        button.onclick = () => {
            if (button.textContent === currentQuestionData.answer) {
                button.style.backgroundColor = 'green';
                disableAllButtons(answerButtons);
            } else {
                button.style.backgroundColor = 'red';
                if (shieldActive && !shieldUsed) {
                    shieldUsed = true;
                    shieldActive = false;
                } else {
                    disableAllButtons(answerButtons);
                    highlightCorrectAnswer(answerButtons);
                    playerEliminated = true;
                }
            }
        };
    });
}

function disableAllButtons(buttons) {
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('used');
    });
}

function highlightCorrectAnswer(buttons) {
    buttons.forEach(btn => {
        if (btn.textContent === currentQuestionData.answer) {
            btn.style.backgroundColor = 'green';
        }
    });
}

function displayAudienceQuestion(audienceQuestions) {
    const questionData = audienceQuestions[Math.floor(Math.random() * audienceQuestions.length)];
    const questionElement = document.querySelector('.question h1');
    const answerButtons = document.querySelectorAll('.answer button');

    questionElement.textContent = `Audience Question: ${questionData.question}`;
    answerButtons.forEach((button, index) => {
        button.textContent = ''; // Clear button text
        button.style.backgroundColor = ''; // Reset button color
        button.disabled = true; // Disable button
    });

    // Move to the next player after displaying the audience question
    currentPlayerIndex++;
    if (currentPlayerIndex < players) {
        resetJokers(); // Reset jokers for the next player
        currentRoundIndex = 0;
        currentQuestionIndex = 0;
        setTimeout(() => displayQuestion(rounds, audienceQuestions), 5000); // Display next player's question after 5 seconds
    } else {
        // Handle the end of the game if needed
    }
}

function use5050Joker() {
    const answerButtons = document.querySelectorAll('.answer button');
    const correctAnswer = Array.from(answerButtons).find(button => button.textContent === currentQuestionData.answer);
    const incorrectAnswers = Array.from(answerButtons).filter(button => button.textContent !== currentQuestionData.answer);

    // Disable two incorrect answers
    incorrectAnswers.slice(0, 2).forEach(button => {
        button.disabled = true;
        button.style.visibility = 'hidden'; // Make the button disappear
    });

    // Change the color of the 50/50 joker button
    const jokerButton = document.querySelector('.joker .btn:nth-child(1)');
    jokerButton.classList.add('used');
    jokerButton.disabled = true;
}

function usePassJoker(rounds, audienceQuestions) {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionsPerRound) {
        displayQuestion(rounds, audienceQuestions);
    } else {
        currentQuestionIndex = 0;
        currentRoundIndex++;
        if (currentRoundIndex < 3) {
            displayQuestion(rounds, audienceQuestions);
        } else {
            currentRoundIndex = 0;
            currentPlayerIndex++;
            if (currentPlayerIndex < players) {
                resetJokers(); // Reset jokers for the next player
                displayQuestion(rounds, audienceQuestions);
            } else {
                displayAudienceQuestion(audienceQuestions);
            }
        }
    }

    // Change the color of the Pass joker button
    const jokerButton = document.querySelector('.joker .btn:nth-child(2)');
    jokerButton.classList.add('used');
    jokerButton.disabled = true;
}

function useShieldJoker() {
    shieldActive = true;
    shieldUsed = false;
    const shieldButton = document.querySelector('.joker .btn:nth-child(3)');
    shieldButton.classList.add('used');
    shieldButton.disabled = true;
}

// Function to reset the timer
function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 120; // Reset to 2 minutes
    startTimer();
}

// Function to start the timer
function startTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
        } else {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Function to reset jokers for the next player
function resetJokers() {
    const jokerButtons = document.querySelectorAll('.joker .btn');
    jokerButtons.forEach(button => {
        button.classList.remove('used');
        button.disabled = false;
    });
    shieldActive = false;
    shieldUsed = false;
}