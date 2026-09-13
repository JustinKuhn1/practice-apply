const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

let tasks = [
  { id: 1, text: "Buy milk", done: false },
  { id: 2, text: "Walk the dog", done: true }
];
let nextId = 3;

app.get("/api/tasks", function (req, res) {
  res.json(tasks);
});

app.post("/api/tasks", function (req, res) {
  const newTask = {
    id: nextId,
    text: req.body.text,
    done: false
  };
  nextId = nextId + 1;

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.patch("/api/tasks/:id", function (req, res) {
  const id = Number(req.params.id);
  const task = tasks.find(function (t) {
    return t.id === id;
  });

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  task.done = !task.done;
  res.json(task);
});

// ---- NEW: DELETE /api/tasks/:id ----
// Same :id pattern as PATCH. Instead of finding and modifying one task,
// we rebuild the whole array using .filter() — keeping everything
// EXCEPT the task whose id matches.
app.delete("/api/tasks/:id", function (req, res) {
  const id = Number(req.params.id);

  const taskExists = tasks.some(function (t) {
    return t.id === id;
  });

  if (!taskExists) {
    return res.status(404).json({ error: "Task not found" });
  }

  tasks = tasks.filter(function (t) {
    return t.id !== id; // keep every task whose id does NOT match
  });

  res.status(204).send(); // 204 = "No Content" — success, nothing to send back
});

app.listen(PORT, function () {
  console.log("Server running at http://localhost:" + PORT);
});
