# TaskFlow Frontend

A responsive task-management dashboard made with plain HTML, CSS and JavaScript.

## Files
- `index.html` — page structure
- `style.css` — layout and visual design
- `app.js` — task interactions and browser storage

## Run it
1. Extract this folder.
2. Open the folder in VS Code.
3. Open `index.html` in Chrome or Edge (or use the VS Code Live Server extension if you already have it).
4. Add a task and try editing, deleting, completing, searching, filtering, sorting and undo.

No compiler, Node.js, npm, framework or database is needed for this frontend demo.

## Important: current data storage
This frontend currently stores tasks in the browser's `localStorage`. Data stays in that browser on that device. It is not yet connected to your C++ console program or shared across devices.

## Next step: connect to the C++ ADSA backend
The existing C++ console menu is not automatically a web server. To connect this page to your C++ algorithms, the C++ program needs a small local HTTP API. The API should provide endpoints such as:
- `GET /api/tasks` — list tasks
- `POST /api/tasks` — add a task
- `PUT /api/tasks/{id}` — edit or mark complete
- `DELETE /api/tasks/{id}` — delete a task

Before changing your current `main.cpp`, make a backup and review the existing code so the ADSA implementations are preserved.
