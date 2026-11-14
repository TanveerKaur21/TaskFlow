// TaskFlow frontend connected to the Python Flask API
let tasks = [];
let displayTasks = [];
let activeFilter = "all";
let toastTimer = null;

const API_URL = "/api";
const $ = (id) => document.getElementById(id);
const taskList = $("taskList");
const modal = $("modalBackdrop");
const form = $("taskForm");


async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}


function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}


function todayISO() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}


function formatDate(value) {
    if (!value) return "No due date";
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}


function isOverdue(task) {
    return !task.completed && task.dueDate && task.dueDate < todayISO();
}


async function loadTasks() {
    try {
        const search = $("searchInput").value.trim();
        const sort = $("sortSelect").value;

        // Fetch all tasks for dashboard counts.
        tasks = await apiRequest("/tasks");

        // Search and ADSA sorting are handled by Python.
        const params = new URLSearchParams({ search, sort });
        displayTasks = await apiRequest(`/tasks?${params.toString()}`);

        // These two display orders are simple presentation options.
        if (sort === "title") {
            displayTasks.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === "newest") {
            displayTasks.sort((a, b) => Number(b.id) - Number(a.id));
        }

        renderTasks();
    } catch (error) {
        console.error(error);
        showToast("Cannot connect to Python backend");
    }
}


function getVisibleTasks() {
    const status = $("statusSelect").value;

    return displayTasks.filter(task => {
        const matchesStatus =
            status === "all" ||
            (status === "completed" ? task.completed : !task.completed);

        let matchesNav = true;

        if (activeFilter === "today") {
            matchesNav = task.dueDate === todayISO();
        } else if (activeFilter === "pending") {
            matchesNav = !task.completed;
        } else if (activeFilter === "completed") {
            matchesNav = task.completed;
        } else if (["high", "medium", "low"].includes(activeFilter)) {
            matchesNav = task.priority === activeFilter;
        }

        return matchesStatus && matchesNav;
    });
}


function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(isOverdue).length;

    $("totalCount").textContent = total;
    $("pendingCount").textContent = pending;
    $("completedCount").textContent = completed;
    $("overdueCount").textContent = overdue;

    const percent = total ? Math.round(completed / total * 100) : 0;
    $("progressText").textContent = `${percent}% completed`;
    $("progressFill").style.width = `${percent}%`;
}


function renderTasks() {
    const visible = getVisibleTasks();
    taskList.innerHTML = "";

    $("emptyState").classList.toggle("visible", visible.length === 0);
    taskList.style.display = visible.length ? "grid" : "none";
    $("taskSummary").textContent = `Showing ${visible.length} of ${tasks.length} tasks`;

    visible.forEach(task => {
        const card = document.createElement("article");
        card.className = `task-card${task.completed ? " is-completed" : ""}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Mark ${task.title} completed`);
        checkbox.addEventListener("change", () => toggleComplete(task.id));

        const main = document.createElement("div");
        main.className = "task-main";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.title;

        const description = document.createElement("div");
        description.className = "task-description";
        description.textContent = task.description || "No description added";
        main.append(title, description);

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = `priority-pill ${task.priority}`;
        priority.textContent = task.priority;

        const due = document.createElement("span");
        due.className = `due-date${isOverdue(task) ? " overdue" : ""}`;
        due.textContent = isOverdue(task)
            ? `Overdue · ${formatDate(task.dueDate)}`
            : formatDate(task.dueDate);
        meta.append(priority, due);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.title = "Edit task";
        edit.setAttribute("aria-label", "Edit task");
        edit.textContent = "✎";
        edit.addEventListener("click", () => openModal(task));

        const del = document.createElement("button");
        del.type = "button";
        del.title = "Delete task";
        del.setAttribute("aria-label", "Delete task");
        del.textContent = "⌫";
        del.addEventListener("click", () => deleteTask(task.id));

        actions.append(edit, del);
        card.append(checkbox, main, meta, actions);
        taskList.append(card);
    });

    renderStats();
}


async function refresh() {
    await loadTasks();
}


function openModal(task = null) {
    form.reset();
    $("taskId").value = task ? task.id : "";
    $("modalTitle").textContent = task ? "Edit task" : "Create a task";
    $("saveTaskBtn").textContent = task ? "Save changes" : "Save task";
    $("taskTitle").value = task?.title || "";
    $("taskDescription").value = task?.description || "";
    $("taskPriority").value = task?.priority || "medium";
    $("taskDue").value = task?.dueDate || "";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => $("taskTitle").focus(), 50);
}


function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}


form.addEventListener("submit", async event => {
    event.preventDefault();

    const title = $("taskTitle").value.trim();
    if (!title) return;

    const id = $("taskId").value;
    const taskData = {
        title,
        description: $("taskDescription").value.trim(),
        priority: $("taskPriority").value,
        dueDate: $("taskDue").value
    };

    try {
        if (id) {
            await apiRequest(`/tasks/${id}`, {
                method: "PUT",
                body: JSON.stringify(taskData)
            });
            showToast("Task updated");
        } else {
            await apiRequest("/tasks", {
                method: "POST",
                body: JSON.stringify(taskData)
            });
            showToast("Task added successfully");
        }

        closeModal();
        await refresh();
    } catch (error) {
        showToast(error.message);
    }
});


async function toggleComplete(id) {
    try {
        const task = tasks.find(item => Number(item.id) === Number(id));
        if (!task) return;

        await apiRequest(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify({ completed: !task.completed })
        });

        showToast(!task.completed
            ? "Task completed — nice work!"
            : "Task moved back to pending");

        await refresh();
    } catch (error) {
        showToast(error.message);
        await refresh();
    }
}


async function deleteTask(id) {
    const task = tasks.find(item => Number(item.id) === Number(id));
    if (!task) return;
    if (!confirm(`Delete "${task.title}"?`)) return;

    try {
        await apiRequest(`/tasks/${id}`, { method: "DELETE" });
        showToast("Task deleted");
        await refresh();
    } catch (error) {
        showToast(error.message);
    }
}


async function undo() {
    try {
        await apiRequest("/undo", { method: "POST" });
        await refresh();
        showToast("Last action undone");
    } catch (error) {
        showToast(error.message);
    }
}


function setFilter(filter, label) {
    activeFilter = filter;

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === filter);
    });

    $("pageName").textContent = label;
    $("listTitle").textContent = filter === "all" ? "Your tasks" : label;
    renderTasks();
}


document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter, button.textContent.trim());
        $("sidebar").classList.remove("open");
    });
});

$("addTaskBtn").addEventListener("click", () => openModal());
$("emptyAddBtn").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);
$("undoBtn").addEventListener("click", undo);
$("searchInput").addEventListener("input", loadTasks);
$("sortSelect").addEventListener("change", loadTasks);
$("statusSelect").addEventListener("change", renderTasks);
$("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("searchInput").focus();
    }
});


const now = new Date();
$("todayLabel").textContent = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
});

const hour = now.getHours();
$("greeting").textContent = hour < 12
    ? "GOOD MORNING"
    : hour < 18
        ? "GOOD AFTERNOON"
        : "GOOD EVENING";

$("undoBtn").disabled = true;
loadTasks();
