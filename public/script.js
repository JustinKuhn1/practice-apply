// ---- Grab the DOM elements ----
const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const counter = document.getElementById("taskCounter");
const list = document.getElementById("taskList");

let tasks = [];

function render() {
  list.innerHTML = "";

  tasks.forEach(function (task) {
    const item = document.createElement("li");

    // A span for the text, so we can style/strike it independently
    // of the delete button sitting next to it.
    const textSpan = document.createElement("span");
    textSpan.textContent = task.text;
    if (task.done) {
      textSpan.style.textDecoration = "line-through";
    }
    textSpan.addEventListener("click", function () {
      toggleTask(task.id);
    });

    // ---- NEW: a delete button per task ----
    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", function (event) {
      event.stopPropagation(); // stop this click from also triggering textSpan's click
      deleteTask(task.id);
    });

    item.appendChild(textSpan);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });

  counter.textContent = "Tasks: " + tasks.length;
}

async function loadTasks() {
  try {
    const response = await fetch("/api/tasks");
    tasks = await response.json();
    render();
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }
}

async function addTask() {
  const taskText = input.value;

  if (taskText === "") {
    return;
  }

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: taskText })
    });

    const newTask = await response.json();
    tasks.push(newTask);
    render();

    input.value = "";
  } catch (error) {
    console.error("Could not add task:", error);
  }
}

async function toggleTask(id) {
  try {
    const response = await fetch("/api/tasks/" + id, {
      method: "PATCH"
    });

    const updatedTask = await response.json();
    const index = tasks.findIndex(function (t) {
      return t.id === id;
    });
    tasks[index] = updatedTask;

    render();
  } catch (error) {
    console.error("Could not edit task:", error);
  }
}

// ---- NEW: delete a task ----
async function deleteTask(id) {
  try {
    await fetch("/api/tasks/" + id, {
      method: "DELETE"
    });

    // Rebuild our local array the same way the server just did:
    // keep everything EXCEPT the task we just deleted.
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });

    render();
  } catch (error) {
    console.error("Could not delete task:", error);
  }
}

// ---- NEW: form submit instead of button click ----
// "submit" fires both when the button is clicked AND when Enter
// is pressed inside the input — one handler covers both cases.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the browser's default page-reload behavior
  addTask();
});

loadTasks();
