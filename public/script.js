document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const setupScreen = document.getElementById('setup-screen');
    const examContainer = document.getElementById('exam-container');
    const resultContainer = document.getElementById('result-container');
    const examSelection = document.getElementById('exam-selection');
    const resultsViewer = document.getElementById('results-viewer');
    const resultsList = document.getElementById('results-list');
    const examsTab = document.getElementById('exams-tab');
    const resultsTab = document.getElementById('results-tab');
    const startForm = document.getElementById('start-form');
    const backButton = document.getElementById('back-button');
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    const submitButton = document.getElementById('submit-button');
    const selectedExamTitle = document.getElementById('selected-exam-title');
    const timeRemaining = document.getElementById('time-remaining');
    const currentQ = document.getElementById('current-q');
    const totalQ = document.getElementById('total-q');

    // State variables
    let availableExams = [];
    let selectedExam = '';
    let examIdentifier = '';
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let candidate = '';
    let answers = [];
    let timer = null;
    let timeLeft = 0;
    let examStartTime = null;

    // Initialize the app
    initializeApp();

    function initializeApp() {
        loadAvailableExams();
        setupEventListeners();
    }

    function loadAvailableExams() {
        fetch('/exams')
            .then(response => response.json())
            .then(exams => {
                availableExams = exams;
                renderExamSelection();
            })
            .catch(error => {
                console.error('Error loading exams:', error);
                showError('Failed to load available exams. Please refresh the page.');
            });
    }

    function renderExamSelection(searchTerm = '') {
        examSelection.innerHTML = '';

        // Filter exams based on search term
        const filteredExams = availableExams.filter(exam =>
            exam.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Add search box
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="exam-search" placeholder="Search exams by name..." value="${searchTerm}">
            <div class="exam-stats">Showing ${filteredExams.length} of ${availableExams.length} exams</div>
        `;
        examSelection.appendChild(searchContainer);

        // Add search functionality
        const searchInput = searchContainer.querySelector('#exam-search');
        searchInput.addEventListener('input', (e) => {
            renderExamSelection(e.target.value);
        });

        // Render filtered exam cards
        filteredExams.forEach(exam => {
            const examCard = document.createElement('div');
            examCard.className = 'exam-card';
            examCard.innerHTML = `
                <h3>${exam.toUpperCase()}</h3>
                <p>Take the ${exam} certification exam</p>
                <div class="exam-meta">
                    <span class="exam-code">${exam.toUpperCase()}</span>
                </div>
            `;
            examCard.addEventListener('click', () => selectExam(exam));
            examSelection.appendChild(examCard);
        });

        // Show message if no exams found
        if (filteredExams.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <h3>No exams found</h3>
                <p>Try adjusting your search terms</p>
            `;
            examSelection.appendChild(noResults);
        }
    }

    function selectExam(examName) {
        selectedExam = examName;
        selectedExamTitle.textContent = `${examName.toUpperCase()} Exam`;
        welcomeScreen.style.display = 'none';
        setupScreen.style.display = 'block';
    }

    function setupEventListeners() {
        // Tab switching
        examsTab.addEventListener('click', () => switchTab('exams'));
        resultsTab.addEventListener('click', () => switchTab('results'));

        // Back button
        backButton.addEventListener('click', () => {
            setupScreen.style.display = 'none';
            welcomeScreen.style.display = 'block';
            startForm.reset();
        });

        // Start form submission
        startForm.addEventListener('submit', handleStartExam);

        // Navigation buttons
        nextButton.addEventListener('click', handleNext);
        prevButton.addEventListener('click', handlePrevious);
        submitButton.addEventListener('click', handleSubmit);

        // Option selection
        document.addEventListener('change', handleOptionChange);
    }

    function switchTab(tab) {
        if (tab === 'exams') {
            examsTab.classList.add('active');
            resultsTab.classList.remove('active');
            examSelection.style.display = 'grid';
            resultsViewer.style.display = 'none';
        } else if (tab === 'results') {
            examsTab.classList.remove('active');
            resultsTab.classList.add('active');
            examSelection.style.display = 'none';
            resultsViewer.style.display = 'block';
            loadResults();
        }
    }

    function loadResults() {
        // Try to load results from results.json
        fetch('/results.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Results file not found');
                }
                return response.json();
            })
            .then(results => {
                renderResults(results);
            })
            .catch(error => {
                console.error('Error loading results:', error);
                resultsList.innerHTML = `
                    <div class="no-results">
                        <h3>No Results Found</h3>
                        <p>No exam results have been recorded yet. Take an exam to see your results here.</p>
                    </div>
                `;
            });
    }

    function renderResults(results, searchTerm = '', page = 1) {
        if (!results || results.length === 0) {
            resultsList.innerHTML = `
                <div class="no-results">
                    <h3>No Results Found</h3>
                    <p>No exam results have been recorded yet. Take an exam to see your results here.</p>
                </div>
            `;
            return;
        }

        // Sort results by timestamp (newest first)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Filter results based on search term (search by exam identifier, candidate name, or exam name)
        const filteredResults = results.filter(result => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (result.examIdentifier && result.examIdentifier.toLowerCase().includes(searchLower)) ||
                (result.candidate && result.candidate.toLowerCase().includes(searchLower)) ||
                (result.examName && result.examName.toLowerCase().includes(searchLower))
            );
        });

        // Pagination settings
        const itemsPerPage = 6; // Show 6 results per page
        const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedResults = filteredResults.slice(startIndex, endIndex);

        resultsList.innerHTML = `
            <div class="results-header">
                <h3>Exam Results History</h3>
                <div class="results-search">
                    <input type="text" id="results-search" placeholder="Search by Exam ID, Name, or Candidate..." value="${searchTerm}">
                    <div class="results-stats">Showing ${paginatedResults.length} of ${filteredResults.length} results (Page ${page} of ${totalPages})</div>
                </div>
            </div>
            <div class="results-grid">
                ${paginatedResults.map((result, index) => {
                    // Find the original index in the full results array
                    const originalIndex = results.indexOf(result);
                    return `
                        <div class="result-card ${result.passed ? 'passed' : 'failed'}">
                            <div class="result-header">
                                <h4>${result.examName?.toUpperCase() || 'Unknown Exam'}</h4>
                                <span class="result-status ${result.passed ? 'pass-badge' : 'fail-badge'}">
                                    ${result.passed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                            <div class="result-details">
                                <p><strong>Exam ID:</strong> ${result.examIdentifier || 'Not available'}</p>
                                <p><strong>Candidate:</strong> ${result.candidate || 'Unknown'}</p>
                                <p><strong>Score:</strong> ${result.score || 0}/${result.totalQuestions || 0} (${result.percentage || 0}%)</p>
                                <p><strong>Duration:</strong> ${result.duration || 0} minutes</p>
                                <p><strong>Date:</strong> ${result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                            <button class="view-details-btn" onclick="showResultDetails(${originalIndex})">
                                View Details
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            ${filteredResults.length === 0 ? `
                <div class="no-results">
                    <h3>No matching results found</h3>
                    <p>Try adjusting your search terms</p>
                </div>
            ` : totalPages > 1 ? `
                <div class="pagination">
                    <button class="page-btn" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
                    <span class="page-info">Page ${page} of ${totalPages}</span>
                    <button class="page-btn" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Next</button>
                </div>
            ` : ''}
        `;

        // Add search functionality
        const searchInput = document.getElementById('results-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderResults(results, e.target.value, 1); // Reset to page 1 when searching
            });
        }

        // Store results globally for detail viewing and pagination
        window.examResults = results;
        window.currentSearchTerm = searchTerm;
    }

    // Global function for pagination
    window.changePage = function(newPage) {
        renderResults(window.examResults, window.currentSearchTerm || '', newPage);
    }

    // Global function for viewing result details
    window.showResultDetails = function(index) {
        const result = window.examResults[index];
        if (!result) return;

        const modal = document.createElement('div');
        modal.className = 'result-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${result.examName?.toUpperCase() || 'Unknown Exam'} - Detailed Results</h3>
                    <button class="close-modal" onclick="this.closest('.result-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="result-summary-modal">
                        <h4>Summary</h4>
                        <p><strong>Candidate:</strong> ${result.candidate || 'Unknown'}</p>
                        <p><strong>Score:</strong> ${result.score || 0}/${result.totalQuestions || 0} (${result.percentage || 0}%)</p>
                        <p><strong>Status:</strong> <span class="${result.passed ? 'correct-answer' : 'incorrect-answer'}">${result.passed ? 'PASSED' : 'FAILED'}</span></p>
                        <p><strong>Duration:</strong> ${result.duration || 0} minutes</p>
                        <p><strong>Date:</strong> ${result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Unknown'}</p>
                    </div>
                    ${result.answers && result.answers.length > 0 ? `
                        <div class="answers-review">
                            <h4>Question Review</h4>
                            ${result.answers.map((answer, idx) => `
                                <div class="question-review ${answer.isCorrect ? 'correct' : 'incorrect'}">
                                    <h5>Question ${idx + 1}</h5>
                                    <p><strong>Q:</strong> ${answer.question || 'Question not available'}</p>
                                    <div class="answer">
                                        <strong>Your Answer:</strong>
                                        <span class="${answer.isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                                            ${answer.selectedAnswer || 'Not answered'}
                                        </span>
                                    </div>
                                    ${!answer.isCorrect ? `
                                        <div class="answer">
                                            <strong>Correct Answer:</strong>
                                            <span class="correct-answer">${answer.correctAnswer || 'Not available'}</span>
                                        </div>
                                    ` : ''}
                                    ${answer.explanation ? `
                                        <div class="explanation">
                                            <strong>Explanation:</strong> ${answer.explanation}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>No detailed answers available for this result.</p>'}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    function handleStartExam(e) {
        e.preventDefault();
        candidate = document.getElementById('name').value.trim();
        const packageSize = document.getElementById('package').value;

        if (!candidate) {
            alert('Please enter your name.');
            return;
        }

        const numQuestions = packageSize === 'small' ? 10 : packageSize === 'mid' ? 25 : 50;

        // Generate exam identifier (ExamDDMMYY_Name)
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yy = String(today.getFullYear()).slice(-2);
        const formattedName = candidate.replace(/\s+/g, ' ').trim().replace(/\s/g, ' ');
        examIdentifier = `${selectedExam}${dd}${mm}${yy}_${formattedName}`;

        // Show loading state
        startForm.querySelector('button[type="submit"]').innerHTML = '<span class="loading"></span> Loading...';

        fetch(`/questions/${selectedExam}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Exam not found');
                }
                return response.json();
            })
            .then(allQuestions => {
                questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, numQuestions);
                setupScreen.style.display = 'none';
                examContainer.style.display = 'block';

                // Initialize exam
                currentQuestionIndex = 0;
                score = 0;
                answers = [];
                examStartTime = Date.now();

                // Set timer (30 minutes per 10 questions)
                const timePerQuestion = 3; // minutes
                timeLeft = numQuestions * timePerQuestion * 60; // convert to seconds

                updateUI();
                showQuestion();
                startTimer();
                enterFullScreen();
                restrictUserInput();

                // Display exam ID
                document.getElementById('exam-id-display').textContent = `Exam ID: ${examIdentifier}`;
            })
            .catch(error => {
                console.error('Error starting exam:', error);
                alert('Failed to load exam questions. Please try again.');
                startForm.querySelector('button[type="submit"]').innerHTML = 'Start Exam';
            });
    }

    function handleOptionChange(e) {
        if (e.target.name === 'option') {
            // Remove selected class from all options
            document.querySelectorAll('.option').forEach(option => {
                option.classList.remove('selected');
            });
            // Add selected class to clicked option
            e.target.closest('.option').classList.add('selected');
        }
    }

    function handleNext() {
        saveCurrentAnswer();

        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
            updateUI();
        } else {
            nextButton.style.display = 'none';
            submitButton.style.display = 'inline-block';
        }
    }

    function handlePrevious() {
        saveCurrentAnswer();

        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
            updateUI();
        }
    }

    function handleSubmit() {
        saveCurrentAnswer();
        calculateScore();
        endExam();
    }

    function saveCurrentAnswer() {
        const selectedOption = document.querySelector('input[name="option"]:checked');
        const question = questions[currentQuestionIndex];

        // Update or add answer
        answers[currentQuestionIndex] = {
            questionId: question.ID,
            question: question.Question,
            selectedAnswer: selectedOption ? selectedOption.value : null,
            correctAnswer: question.Answer,
            explanation: question.Explanation,
            referenceImage: question.ReferenceImage,
            isCorrect: selectedOption ? selectedOption.value === question.Answer : false
        };
    }

    function calculateScore() {
        score = answers.filter(answer => answer.isCorrect).length;
    }

    function showQuestion() {
        const question = questions[currentQuestionIndex];
        const savedAnswer = answers[currentQuestionIndex];

        let questionHTML = `
            <div class="question-text">
                <strong>Question ${currentQuestionIndex + 1}:</strong> ${question.Question}
            </div>
        `;

        // Add reference image if available
        if (question.ReferenceImage) {
            // Fix image path for web server (convert ./images/ to /images/)
            const imagePath = question.ReferenceImage.replace('./images/', '/images/');
            questionHTML += `<img src="${imagePath}" alt="Reference Image" class="reference-image">`;
        }

        // Add options
        questionHTML += '<div class="options">';
        question.Options.forEach((option, index) => {
            const isSelected = savedAnswer && savedAnswer.selectedAnswer === option;
            questionHTML += `
                <div class="option ${isSelected ? 'selected' : ''}">
                    <input type="radio" id="option${index}" name="option" value="${option}" ${isSelected ? 'checked' : ''}>
                    <label for="option${index}">${option}</label>
                </div>
            `;
        });
        questionHTML += '</div>';

        document.getElementById('question-container').innerHTML = questionHTML;
        updateUI();
    }

    function updateUI() {
        currentQ.textContent = currentQuestionIndex + 1;
        totalQ.textContent = questions.length;

        // Update navigation buttons
        prevButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
        nextButton.style.display = currentQuestionIndex < questions.length - 1 ? 'inline-block' : 'none';
        submitButton.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';
    }

    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timer);
                handleSubmit();
                alert('Time is up! Your exam has been submitted automatically.');
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeRemaining.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Change color when time is running low
        if (timeLeft < 300) { // 5 minutes
            timeRemaining.style.color = '#dc3545';
        } else if (timeLeft < 600) { // 10 minutes
            timeRemaining.style.color = '#ffc107';
        }
    }

    function endExam() {
        clearInterval(timer);
        examContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        const percentage = Math.round((score / questions.length) * 100);
        const examDuration = Math.round((Date.now() - examStartTime) / 1000 / 60); // minutes

        resultContainer.innerHTML = `
            <div class="result-summary">
                <div class="result-score">${score}/${questions.length}</div>
                <div class="result-details">
                    <p><strong>Exam ID:</strong> ${examIdentifier}</p>
                    <p>Percentage: ${percentage}%</p>
                    <p>Time taken: ${examDuration} minutes</p>
                    <p>Status: ${percentage >= 70 ? '<span style="color: #28a745;">PASSED</span>' : '<span style="color: #dc3545;">FAILED</span>'}</p>
                    <p style="background: #e9ecef; padding: 10px; border-radius: 4px; margin-top: 10px;">
                        <strong>Note:</strong> Please save your Exam ID (${examIdentifier}) for future reference to retrieve your results.
                    </p>
                </div>
            </div>

            <div class="review-section">
                <h3>Question Review</h3>
                ${answers.map((answer, index) => `
                    <div class="question-review ${answer.isCorrect ? 'correct' : 'incorrect'}">
                        <h4>Question ${index + 1}</h4>
                        <p><strong>Q:</strong> ${answer.question}</p>
                        <div class="answer">
                            <strong>Your Answer:</strong>
                            <span class="${answer.isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                                ${answer.selectedAnswer || 'Not answered'}
                            </span>
                        </div>
                        ${!answer.isCorrect ? `
                            <div class="answer">
                                <strong>Correct Answer:</strong>
                                <span class="correct-answer">${answer.correctAnswer}</span>
                            </div>
                        ` : ''}
                        ${answer.explanation ? `
                            <div class="explanation">
                                <strong>Explanation:</strong> ${answer.explanation}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Submit results to server
        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                candidate: candidate,
                examName: selectedExam,
                examIdentifier: examIdentifier,
                answers: answers,
                score: score,
                totalQuestions: questions.length,
                percentage: percentage,
                duration: examDuration,
                passed: percentage >= 70
            })
        }).then(() => {
            exitFullScreen();
        }).catch(error => {
            console.error('Error submitting results:', error);
        });
    }

    function enterFullScreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }

    function exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    function restrictUserInput() {
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prevent keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'U') ||
                (e.ctrlKey && e.key === 'S') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                e.key === 'Escape'
            ) {
                e.preventDefault();
                return false;
            }
        });

        // Prevent tab switching (blur event)
        window.addEventListener('blur', () => {
            alert('Warning: Please do not switch tabs or windows during the exam. Your exam will continue.');
            setTimeout(() => window.focus(), 100);
        });

        // Prevent copy/paste
        document.addEventListener('copy', (e) => e.preventDefault());
        document.addEventListener('paste', (e) => e.preventDefault());
        document.addEventListener('cut', (e) => e.preventDefault());
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
});
