// JavaScriptová logika pro řízení interaktivního testu a flip kartiček
let questions = [];
let currentIndex = 0;
let isCardFlipped = false; // Pomocná proměnná pro stav otočení kartičky

// Načte otázky z DOMu POUZE JEDNOU při startu stránky
function initializeQuestions() {
    questions = []; 
    const cards = document.querySelectorAll('.qa-card');
    
    // Zde bude nyní vždy true
    const rememberEnabled = isRememberEnabled();

    cards.forEach((card, index) => {
        const qHeader = card.querySelector('.question').innerHTML;
        const aContent = card.querySelector('.answer').innerHTML;
        
        let isDone = false;

        // Pokusíme se načíst stav z localStorage podle indexu otázky
        if (rememberEnabled) {
            const savedStatus = localStorage.getItem(`q_done_${index}`);
            if (savedStatus === 'true') {
                isDone = true;
            }
        }

        questions.push({ q: qHeader, a: aContent, done: isDone });
    });
    
    // Ochrana pro případ, že element na stránce chybí
    const totalQuestionsNum = document.getElementById('total-questions-num');
    if (totalQuestionsNum) {
        totalQuestionsNum.innerText = questions.length;
    }
    
    // Checkbox bude na začátku vždy zaškrtnutý
    const checkbox = document.getElementById('toggle-remember');
    if (checkbox) {
        checkbox.checked = true;
    }
}

// Pomocná funkce pro ověření, zda je ukládání aktivní
function isRememberEnabled() {
    localStorage.setItem('remember_done_status', 'true');
    return true;
}

// Funkce volaná při změně stavu checkboxu uživatelem
function handleRememberToggle() {
    const checkbox = document.getElementById('toggle-remember');
    if (!checkbox) return;

    localStorage.setItem('remember_done_status', checkbox.checked);

    if (!checkbox.checked) {
        clearSavedProgress();
    } else {
        saveAllQuestionsProgress();
    }
}

function clearSavedProgress() {
    questions.forEach((_, index) => {
        localStorage.removeItem(`q_done_${index}`);
    });
}

// Live vyhledávání na úvodní stránce
function handleSearch(e) {
    const searchText = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.qa-card');

    cards.forEach(card => {
        const qText = card.querySelector('.question').innerText.toLowerCase(); 
        const aText = card.querySelector('.answer').innerText.toLowerCase();

        if (qText.includes(searchText) || aText.includes(searchText)) {
            card.style.display = ''; 
        } else {
            card.style.display = 'none';
        }
    });
}

function saveAllQuestionsProgress() {
    questions.forEach((q, index) => {
        if (q.done) {
            localStorage.setItem(`q_done_${index}`, 'true');
        } else {
            localStorage.removeItem(`q_done_${index}`);
        }
    });
}

// Po úplném načtení struktury DOM posbíráme otázky z HTML elementů
window.onload = function() {
    initializeQuestions();
    
    const checkbox = document.getElementById('toggle-remember');
    if (checkbox) {
        checkbox.checked = true; // Zajištění výchozího zaškrtnutí
        checkbox.addEventListener('change', handleRememberToggle);
    }
    
    // Aktivace vyhledávacího pole na první stránce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // BEZCHYBNÉ OVLÁDÁNÍ KARTIČKY PRO PC I MOBIL
    const flashcard = document.getElementById('flashcard-box');
    if (flashcard) {
        // Kontrola, zda zařízení podporuje dotykové události
        const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (supportsTouch) {
            // Pro mobily: reaguje okamžitě na konec dotyku bez prodlevy
            flashcard.addEventListener('touchend', function(e) {
                e.preventDefault(); 
                toggleFlashcardFlip();
            });
        } else {
            // Pro PC a notebooky: klasické kliknutí myší
            flashcard.addEventListener('click', toggleFlashcardFlip);
        }
    }
};

// --- PŘEPÍNÁNÍ REŽIMŮ (ZOBRAZENÍ) ---

function hideAllViews() {
    const views = ['study-view', 'test-view', 'flashcards-view'];
    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) view.style.display = 'none';
    });

    // Skryjeme/zobrazíme ovládací tlačítka v menu podle potřeby
    if (document.getElementById('btn-toggle-study')) document.getElementById('btn-toggle-study').style.display = 'inline-block';
    if (document.getElementById('btn-toggle-test')) document.getElementById('btn-toggle-test').style.display = 'inline-block';
    if (document.getElementById('btn-toggle-flashcards')) document.getElementById('btn-toggle-flashcards').style.display = 'inline-block';
    
    // Skryjeme vyhledávač v jiných režimech než studium
    if (document.getElementById('search-input')) document.getElementById('search-input').style.display = 'none';
}

function startStudy() {
    hideAllViews();
    document.getElementById('study-view').style.display = 'block';
    document.getElementById('btn-toggle-study').style.display = 'none';
    
    // Zobrazení a vyčištění vyhledávače při návratu na studium
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.style.display = 'inline-block';
        searchInput.value = '';
        // Znovu zobrazí všechny dříve odfiltrované karty
        document.querySelectorAll('.qa-card').forEach(card => card.style.display = '');
    }
}

function startTest() {
    if (questions.length === 0) {
        alert('Chyba: Nenašly se žádné otázky.');
        return;
    }
    hideAllViews();
    currentIndex = 0;
    document.getElementById('test-view').style.display = 'block';
    document.getElementById('btn-toggle-test').style.display = 'none';
    showQuestion();
}

function startFlashcards() {
    if (questions.length === 0) {
        alert('Chyba: Nenašly se žádné otázky.');
        return;
    }
    hideAllViews();
    currentIndex = 0;
    document.getElementById('flashcards-view').style.display = 'block';
    document.getElementById('btn-toggle-flashcards').style.display = 'none';
    showFlashcard();
}

// --- LOGIKA PRO REGULÉRNÍ TEST ---

function showQuestion() {
    const feedbackBox = document.getElementById('test-feedback-box');
    if (feedbackBox) feedbackBox.style.display = 'none';
    
    const userInput = document.getElementById('test-user-input');
    if (userInput) {
        userInput.value = '';
        userInput.disabled = false;
    }

    // OPRAVENO: id="btn-check" odpovídá vašemu HTML
    const checkBtn = document.getElementById('btn-check'); 
    if (checkBtn) {
        checkBtn.innerText = 'Zkontrolovat odpověď 🔍';
    }

    const currentNumElement = document.getElementById('current-question-num');
    if (currentNumElement) {
        currentNumElement.innerText = parseInt(currentIndex + 1);
    }
    
    const totalQuestionsNum = document.getElementById('total-questions-num');
    if (totalQuestionsNum) {
        totalQuestionsNum.innerText = questions.length;
    }
    
    document.getElementById('test-question-area').innerHTML = questions[currentIndex].q;
    document.getElementById('test-correct-answer-text').innerHTML = questions[currentIndex].a;

    updateNavigationButtons();
    updateDoneStatusUI();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('btn-prev-question');
    const nextBtn = document.getElementById('btn-next-question');

    if (prevBtn) {
        prevBtn.disabled = (currentIndex === 0);
        prevBtn.style.opacity = (currentIndex === 0) ? '0.5' : '1';
    }
    if (nextBtn) {
        if (currentIndex === questions.length - 1) {
            nextBtn.innerText = 'Dokončit test 🏁';
        } else {
            nextBtn.innerText = 'Další →';
        }
    }
}

function previousQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        showQuestion();
    }
}

function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showQuestion();
    } else {
        alert('Skvělá práce! Dosáhl jsi konce testu. Kvíz se spustí opět od první otázky.');
        startTest();
    }
}

// --- LOGIKA PRO FLIP KARTIČKY ---

function showFlashcard() {
    const flashcard = document.getElementById('flashcard-box');
    if (flashcard) {
        flashcard.classList.remove('flipped'); 
    }

    const frontTextElement = document.getElementById('flashcard-front-text');
    const backTextElement = document.getElementById('flashcard-back-text');
    
    if (frontTextElement) frontTextElement.innerHTML = questions[currentIndex].q;
    if (backTextElement) backTextElement.innerHTML = questions[currentIndex].a;

    const currentFlashcardNum = document.getElementById('current-flashcard-num');
    if (currentFlashcardNum) {
        currentFlashcardNum.innerText = parseInt(currentIndex + 1);
    }
    
    const totalFlashcardsNum = document.getElementById('total-flashcards-num');
    if (totalFlashcardsNum) {
        totalFlashcardsNum.innerText = questions.length;
    }

    const prevBtn = document.getElementById('btn-prev-flashcard');
    const nextBtn = document.getElementById('btn-next-flashcard');
    if (prevBtn) prevBtn.disabled = (currentIndex === 0);
    if (nextBtn) {
        nextBtn.innerText = (currentIndex === questions.length - 1) ? 'Znovu od začátku 🏁' : 'Další kartička →';
    }
}

function toggleFlashcardFlip() {
    const flashcard = document.getElementById('flashcard-box');
    if (!flashcard) return;
    flashcard.classList.toggle('flipped');
}

function previousFlashcard() {
    if (currentIndex > 0) {
        currentIndex--;
        showFlashcard();
    }
}

// OPRAVENO: Odstraněna rekurzivní chyba "nekonečného alertu" na konci kartiček
function nextFlashcard() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showFlashcard();
    } else {
        alert('Prošel jsi všechny kartičky! Spouštím znovu.');
        currentIndex = 0;
        showFlashcard();
    }
}

// --- POMOCNÉ FUNKCE STAVŮ (UMÍM/NEUMÍM) ---

function toggleQuestionDone() {
    if (questions.length === 0) return;
    
    const currentQuestion = questions[currentIndex];
    currentQuestion.done = !currentQuestion.done;
    
    if (isRememberEnabled()) {
        if (currentQuestion.done) {
            localStorage.setItem(`q_done_${currentIndex}`, 'true');
        } else {
            localStorage.removeItem(`q_done_${currentIndex}`);
        }
    }
    
    updateDoneStatusUI();
}

function updateDoneStatusUI() {
    const currentQuestion = questions[currentIndex];
    const toggleBtn = document.getElementById('btn-toggle-done');
    const statusIndicator = document.getElementById('question-status-indicator');
    
    if (!toggleBtn) return;

    if (currentQuestion.done) {
        toggleBtn.innerText = 'Neumím (vrátit zpět)';
        toggleBtn.style.backgroundColor = '#dc3545';
        toggleBtn.style.color = 'white';
        
        if (statusIndicator) {
            statusIndicator.innerText = ' (Splněno ✓)';
            statusIndicator.style.color = '#28a745';
        }
    } else {
        toggleBtn.innerText = 'Umím to!';
        toggleBtn.style.backgroundColor = '#28a745';
        toggleBtn.style.color = 'white';
        
        if (statusIndicator) {
            statusIndicator.innerText = '';
        }
    }
}

function checkAnswer() {
    const feedbackBox = document.getElementById('test-feedback-box');
    const userInput = document.getElementById('test-user-input');
    // OPRAVENO: id="btn-check" odpovídá vašemu HTML
    const checkBtn = document.getElementById('btn-check'); 
    
    if (!feedbackBox) return;
    
    if (feedbackBox.style.display === 'none' || feedbackBox.style.display === '') {
        feedbackBox.style.display = 'block';
        if (userInput) userInput.disabled = true; 
        if (checkBtn) checkBtn.innerText = 'Skrýt odpověď 👁️';
    } else {
        feedbackBox.style.display = 'none';
        if (userInput) userInput.disabled = false; 
        if (checkBtn) checkBtn.innerText = 'Zkontrolovat odpověď 🔍';
    }
}