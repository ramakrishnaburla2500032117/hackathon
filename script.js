
// QUIZ BUILDER - MAIN JAVASCRIPT

function getData(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Default quiz questions
if (getData("quizzes").length === 0) {
    saveData("quizzes", [{
        id: "quiz1",
        title: "Basic Computer Quiz",
        questions: [
            {
                text: "What does HTML stand for?",
                options: [
                    "Hyper Text Markup Language",
                    "High Text Machine Language",
                    "Hyper Tool Multi Language",
                    "Home Text Markup Language"
                ],
                correct: "Hyper Text Markup Language"
            },
            {
                text: "Which language is used for styling web pages?",
                options: ["HTML", "CSS", "Python", "Java"],
                correct: "CSS"
            },
            {
                text: "Which company developed Java?",
                options: ["Microsoft", "Google", "Sun Microsystems", "Apple"],
                correct: "Sun Microsystems"
            }
        ]
    }]);
}

// Safe display
function safe(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Check login
function checkLogin(role) {
    const user = JSON.parse(
        sessionStorage.getItem("currentUser") || "null"
    );

    if (!user || user.role !== role) {
        alert("Please login first!");
        location.href = "login.html";
        return false;
    }

    return true;
}

// Logout
function logout() {
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("selectedQuiz");
    location.href = "login.html";
}

// SIGNUP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        if (!role) {
            alert("Please select account type!");
            return;
        }

        const key = role === "admin" ? "admins" : "students";
        const accounts = getData(key);

        const allAccounts = [
            ...getData("admins"),
            ...getData("students")
        ];

        if (allAccounts.some(a => a.email === email)) {
            alert("Email already registered!");
            return;
        }

        accounts.push({
            name: name,
            email: email,
            password: password
        });

        saveData(key, accounts);

        alert(role + " Signup Successful! Please Login.");
        location.href = "login.html";
    });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail")
            .value.trim().toLowerCase();

        const password = document.getElementById("loginPassword").value;

        const admin = getData("admins").find(a =>
            a.email === email && a.password === password
        );

        const student = getData("students").find(s =>
            s.email === email && s.password === password
        );

        if (admin) {
            sessionStorage.setItem("currentUser", JSON.stringify({
                name: admin.name,
                email: admin.email,
                role: "admin"
            }));

            location.href = "admin.html";
        }
        else if (student) {
            sessionStorage.setItem("currentUser", JSON.stringify({
                name: student.name,
                email: student.email,
                role: "student"
            }));

            location.href = "user.html";
        }
        else {
            alert("Invalid Email or Password!");
        }
    });
}

// ADMIN: Change question type
let draftQuestions = [];

function changeQuestionType() {
    const type = document.getElementById("questionType").value;
    const options = document.getElementById("options");

    if (type === "truefalse") {
        options.value = "True,False";
        options.disabled = true;
    } else {
        options.disabled = false;
        options.value = "";
    }
}

// ADMIN: Add question
function addQuestion() {
    const text = document.getElementById("questionText").value.trim();
    const type = document.getElementById("questionType").value;
    const optionsText = document.getElementById("options").value;
    const correct = document.getElementById("correctAnswer").value.trim();

    const options = optionsText.split(",")
        .map(x => x.trim())
        .filter(Boolean);

    if (!text || !correct || options.length < 2) {
        alert("Enter question, options and correct answer!");
        return;
    }

    if (!options.some(x => x.toLowerCase() === correct.toLowerCase())) {
        alert("Correct answer must match one of the options!");
        return;
    }

    draftQuestions.push({
        text: text,
        type: type,
        options: options,
        correct: correct
    });

    document.getElementById("draftQuestions").innerText =
        "Questions added: " + draftQuestions.length;

    document.getElementById("questionStatus").innerText =
        "Question added successfully!";

    document.getElementById("questionText").value = "";
    document.getElementById("options").value = "";
    document.getElementById("correctAnswer").value = "";
}

// ADMIN: Publish quiz
function createQuiz() {
    const title = document.getElementById("quizTitle").value.trim();

    if (!title || draftQuestions.length === 0) {
        alert("Enter quiz name and add questions!");
        return;
    }

    const quizzes = getData("quizzes");

    quizzes.push({
        id: Date.now().toString(),
        title: title,
        questions: [...draftQuestions]
    });

    saveData("quizzes", quizzes);

    draftQuestions = [];

    document.getElementById("quizTitle").value = "";
    document.getElementById("draftQuestions").innerText =
        "Questions added: 0";

    document.getElementById("questionStatus").innerText = "";

    alert("Quiz Published Successfully!");
    loadAdmin();
}

// ADMIN: Delete quiz
function deleteQuiz(id) {
    if (!confirm("Delete this quiz?")) return;

    const quizzes = getData("quizzes").filter(q => q.id !== id);
    saveData("quizzes", quizzes);

    loadAdmin();
}

// ADMIN DASHBOARD
function loadAdmin() {
    if (!checkLogin("admin")) return;

    const quizzes = getData("quizzes");
    const students = getData("students");
    const results = getData("results");

    const quizList = document.getElementById("quizList");
    const studentList = document.getElementById("studentList");
    const allResults = document.getElementById("allResults");

    if (!quizList || !studentList || !allResults) return;

    quizList.innerHTML = quizzes.length
        ? quizzes.map(q => `
            <div class="card">
                <h3>${safe(q.title)}</h3>
                <p>Questions: ${q.questions.length}</p>
                <button class="danger"
                    onclick="deleteQuiz('${q.id}')">Delete Quiz</button>
            </div>
        `).join("")
        : "<p>No quizzes available.</p>";

    studentList.innerHTML = students.length
        ? `<table>
            <tr><th>Name</th><th>Email</th></tr>
            ${students.map(s => `
                <tr>
                    <td>${safe(s.name)}</td>
                    <td>${safe(s.email)}</td>
                </tr>
            `).join("")}
           </table>`
        : "<p>No students registered.</p>";

    allResults.innerHTML = results.length
        ? `<table>
            <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Quiz</th>
                <th>Marks</th>
                <th>Date</th>
            </tr>
            ${results.map(r => `
                <tr>
                    <td>${safe(r.name)}</td>
                    <td>${safe(r.email)}</td>
                    <td>${safe(r.quizTitle)}</td>
                    <td>${r.score}/${r.total}</td>
                    <td>${safe(r.date)}</td>
                </tr>
            `).join("")}
           </table>`
        : "<p>No student results available.</p>";
}

// STUDENT DASHBOARD
function loadStudent() {
    if (!checkLogin("student")) return;

    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    const quizzes = getData("quizzes");

    document.getElementById("welcomeStudent").innerText =
        "Welcome " + user.name;

    const area = document.getElementById("availableQuizzes");

    area.innerHTML = quizzes.length
        ? quizzes.map(q => `
            <div class="card">
                <h3>${safe(q.title)}</h3>
                <p>Questions: ${q.questions.length}</p>
                <button onclick="startQuiz('${q.id}')">
                    Start Quiz
                </button>
            </div>
        `).join("")
        : "<p>No quizzes available.</p>";
}

// Start quiz
function startQuiz(id) {
    sessionStorage.setItem("selectedQuiz", id);
    location.href = "quiz.html";
}

// Shuffle questions and options
function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

// QUIZ PAGE
let activeQuiz = null;

function loadQuiz() {
    if (!checkLogin("student")) return;

    const id = sessionStorage.getItem("selectedQuiz");
    const quizzes = getData("quizzes");

    activeQuiz = quizzes.find(q => q.id === id);

    if (!activeQuiz) {
        alert("Quiz not found!");
        location.href = "user.html";
        return;
    }

    const questions = shuffle(activeQuiz.questions);

    document.getElementById("quizHeading").innerText =
        activeQuiz.title;

    const area = document.getElementById("quizQuestions");

    area.innerHTML = questions.map((q, i) => `
        <div class="question">
            <h3>${i + 1}. ${safe(q.text)}</h3>

            ${shuffle(q.options).map(option => `
                <label class="option">
                    <input type="radio"
                        name="question${i}"
                        value="${safe(option)}"
                        required>
                    ${safe(option)}
                </label>
            `).join("")}
        </div>
    `).join("");

    activeQuiz.questionsForAttempt = questions;
}

// SUBMIT QUIZ
const quizForm = document.getElementById("quizForm");

if (quizForm) {
    quizForm.addEventListener("submit", function(e) {
        e.preventDefault();

        if (!activeQuiz) return;

        const user = JSON.parse(sessionStorage.getItem("currentUser"));
        const questions = activeQuiz.questionsForAttempt;

        let score = 0;

        questions.forEach((q, i) => {
            const selected = document.querySelector(
                `input[name="question${i}"]:checked`
            );

            if (selected &&
                selected.value.toLowerCase() === q.correct.toLowerCase()) {
                score++;
            }
        });

        const results = getData("results");

        results.push({
            name: user.name,
            email: user.email,
            quizTitle: activeQuiz.title,
            score: score,
            total: questions.length,
            date: new Date().toLocaleString()
        });

        saveData("results", results);

        sessionStorage.setItem("lastScore", score);
        sessionStorage.setItem("lastTotal", questions.length);
        sessionStorage.setItem("lastQuiz", activeQuiz.title);

        sessionStorage.removeItem("selectedQuiz");

        alert("Your Marks: " + score + "/" + questions.length);
        location.href = "result.html";
    });
}

// STUDENT RESULTS
function loadResults() {
    if (!checkLogin("student")) return;

    const user = JSON.parse(sessionStorage.getItem("currentUser"));

    const results = getData("results").filter(
        r => r.email === user.email
    );

    const area = document.getElementById("myResults");

    area.innerHTML = results.length
        ? `<table>
            <tr><th>Quiz</th><th>Marks</th><th>Date</th></tr>
            ${results.map(r => `
                <tr>
                    <td>${safe(r.quizTitle)}</td>
                    <td>${r.score}/${r.total}</td>
                    <td>${safe(r.date)}</td>
                </tr>
            `).join("")}
           </table>`
        : "<p>You have not attempted any quizzes.</p>";
}

// PAGE DETECTION
const page = location.pathname.split("/").pop();

if (page === "admin.html") loadAdmin();
if (page === "user.html") loadStudent();
if (page === "quiz.html") loadQuiz();
if (page === "result.html") loadResults();
