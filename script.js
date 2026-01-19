// ----------------------
// 要素取得
// ----------------------
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const levelSelect = document.getElementById("todo-level");
const searchInput = document.getElementById("search-input");
const repeatSelect = document.getElementById("todo-repeat");

// ----------------------
// 起動時処理
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    loadTodos();
    updateRepeatingTodos();
    markExpiredTodos();
    markTodayTodos();
    sortTodosByDate();
});

// ----------------------
// ToDo追加
// ----------------------
addBtn.addEventListener("click", addTodo);

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTodo();
});

function addTodo() {
    const text = input.value.trim();
    const level = levelSelect.value;
    const date = dateInput.value;
    const repeat = repeatSelect.value;

    if (text === "") return;

    createTodoItem(text, false, level, date, repeat);
    saveTodos();

    input.value = "";

    markExpiredTodos();
    markTodayTodos();
    sortTodosByDate();
}

// ----------------------
// ToDo要素を作成
// ----------------------
function createTodoItem(text, completed = false, level = "light", date = "", repeat = "none") {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.classList.add(level);
    li.setAttribute("draggable", "true");

    if (completed) li.classList.add("completed");

    li.innerHTML = `
        <div class="todo-main">
            <span class="todo-text">${text}</span>
            <span class="todo-date">${date}</span>
            <span class="todo-repeat">${repeat}</span>
        </div>
        <div class="actions">
            <button class="edit-btn">✏️</button>
            <button class="delete-btn">✕</button>
        </div>
    `;

    let taskText = li.querySelector(".todo-text");
    const editBtn = li.querySelector(".edit-btn");
    const deleteBtn = li.querySelector(".delete-btn");

    // 完了切り替え
    li.addEventListener("click", (e) => {
        if (
            e.target === deleteBtn ||
            e.target === editBtn ||
            e.target.tagName === "INPUT" ||
            e.target.closest(".actions")
        ) return;

        li.classList.toggle("completed");
        saveTodos();
    });

    // 削除
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        li.remove();
        saveTodos();
    });

    // 編集
    editBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const currentText = taskText.textContent;

        const input = document.createElement("input");
        input.type = "text";
        input.value = currentText;
        input.classList.add("edit-input");

        taskText.replaceWith(input);
        input.focus();

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") cancelEdit();
        });

        input.addEventListener("blur", saveEdit);

        function saveEdit() {
            const newText = input.value.trim() || currentText;
            const span = document.createElement("span");
            span.classList.add("todo-text");
            span.textContent = newText;
            input.replaceWith(span);

            taskText = span;
            saveTodos();
        }

        function cancelEdit() {
            const span = document.createElement("span");
            span.classList.add("todo-text");
            span.textContent = currentText;
            input.replaceWith(span);

            taskText = span;
        }
    });

    // ドラッグ & ドロップ
    li.addEventListener("dragstart", () => {
        li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        saveTodos();
    });

    list.appendChild(li);
}

// ----------------------
// ドラッグ並び替え
// ----------------------
list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(list, e.clientY);
    if (afterElement == null) {
        list.appendChild(dragging);
    } else {
        list.insertBefore(dragging, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll(".todo-item:not(.dragging)")];

    return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ----------------------
// 保存
// ----------------------
function saveTodos() {
    const todos = [];
    document.querySelectorAll(".todo-item").forEach((item) => {
        let level = "light";
        if (item.classList.contains("middle")) level = "middle";
        if (item.classList.contains("deep")) level = "deep";

        todos.push({
            text: item.querySelector(".todo-text").textContent,
            completed: item.classList.contains("completed"),
            level: level,
            date: item.querySelector(".todo-date")?.textContent || "",
            repeat: item.querySelector(".todo-repeat")?.textContent || "none"
        });
    });

    localStorage.setItem("deepsea_todos", JSON.stringify(todos));
}

// ----------------------
// 読み込み
// ----------------------
function loadTodos() {
    const saved = JSON.parse(localStorage.getItem("deepsea_todos") || "[]");
    saved.forEach((todo) =>
        createTodoItem(todo.text, todo.completed, todo.level, todo.date, todo.repeat)
    );
}

// ----------------------
// 期限切れタスクを深海の底へ
// ----------------------
function markExpiredTodos() {
    const items = document.querySelectorAll(".todo-item");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    items.forEach(item => {
        const dateEl = item.querySelector(".todo-date");
        if (!dateEl) return;

        const taskDate = new Date(dateEl.textContent);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate < today) {
            item.classList.add("expired");
        } else {
            item.classList.remove("expired");
        }
    });
}

// ----------------------
// 今日のタスクを光らせる
// ----------------------
function markTodayTodos() {
    const items = document.querySelectorAll(".todo-item");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    items.forEach(item => {
        const dateEl = item.querySelector(".todo-date");
        if (!dateEl) return;

        const taskDate = new Date(dateEl.textContent);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate.getTime() === today.getTime()) {
            item.classList.add("today");
        } else {
            item.classList.remove("today");
        }
    });
}

// ----------------------
// 繰り返しタスクの自動更新
// ----------------------
function updateRepeatingTodos() {
    const items = document.querySelectorAll(".todo-item");
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    items.forEach(item => {
        const dateEl = item.querySelector(".todo-date");
        const repeatEl = item.querySelector(".todo-repeat");
        if (!dateEl || !repeatEl) return;

        const repeat = repeatEl.textContent;
        if (repeat === "none") return;

        const taskDate = new Date(dateEl.textContent);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate >= now) return;

        let nextDate = new Date(taskDate);

        if (repeat === "daily") nextDate.setDate(nextDate.getDate() + 1);
        if (repeat === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        if (repeat === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
        const dd = String(nextDate.getDate()).padStart(2, "0");

        dateEl.textContent = `${yyyy}-${mm}-${dd}`;
    });

    saveTodos();
}

// ----------------------
// 日付順に並び替え（今日が最優先）
// ----------------------
function sortTodosByDate() {
    const items = Array.from(document.querySelectorAll(".todo-item"));
    const list = document.getElementById("todo-list");

    items.sort((a, b) => {
        const dateA = new Date(a.querySelector(".todo-date")?.textContent || "9999-12-31");
        const dateB = new Date(b.querySelector(".todo-date")?.textContent || "9999-12-31");
        return dateA - dateB;
    });

    items.forEach(item => list.appendChild(item));
}
// ----------------------
// ヘルプモーダル
// ----------------------
const helpBtn = document.querySelector(".help-btn");
const helpModal = document.querySelector(".help-modal");
const closeHelp = document.querySelector(".close-help");

if (helpBtn && helpModal && closeHelp) {
    helpBtn.addEventListener("click", () => {
        helpModal.style.display = "flex";
    });

    closeHelp.addEventListener("click", () => {
        helpModal.style.display = "none";
    });

    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = "none";
        }
    });
}