require("dotenv").config(); // loads variables from .env into process.env

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const path = require("path");

app.use(express.json());
app.use(express.static("public")); // still useful for local dev

// Vercel ignores express.static(), so we need an explicit route for "/"
// to serve index.html when deployed there.
app.get("/", function (req, res) {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// ---- Connect to Supabase ----
// These values come from .env (never hardcode real keys directly in code
// that gets pushed to GitHub — see the .env setup below).
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ---- GET /api/tasks — SELECT * FROM tasks ----
app.get("/api/tasks", async function (req, res) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ---- POST /api/tasks — INSERT INTO tasks ----
app.post("/api/tasks", async function (req, res) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ text: req.body.text, done: false })
    .select() // .select() here means "give me back the row you just inserted"
    .single(); // .single() means "I only expect one row back, not an array"

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// ---- PATCH /api/tasks/:id — UPDATE tasks SET done = ... WHERE id = ... ----
app.patch("/api/tasks/:id", async function (req, res) {
  const id = Number(req.params.id);

  // First, get the current value so we can flip it
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("done")
    .eq("id", id) // .eq() means "WHERE id = id" — eq stands for "equals"
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ done: !existing.done })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ---- DELETE /api/tasks/:id — DELETE FROM tasks WHERE id = ... ----
app.delete("/api/tasks/:id", async function (req, res) {
  const id = Number(req.params.id);

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

// Vercel imports this file and calls the exported app directly as a
// serverless function — it does NOT run app.listen() itself. Locally,
// though, we still want app.listen() so `node server.js` works normally.
// This checks: "is Vercel running this?" and only starts a real server if not.
if (!process.env.VERCEL) {
  app.listen(PORT, function () {
    console.log("Server running at http://localhost:" + PORT);
  });
}

module.exports = app;
