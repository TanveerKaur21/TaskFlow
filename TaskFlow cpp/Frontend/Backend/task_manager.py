# TaskFlow - Task management, Hash Map and Stack
from storage import load_tasks, save_tasks
from algorithms import binary_search


class TaskManager:
    def __init__(self):
        self.tasks = load_tasks()
        self.undo_stack = []
        self.task_map = {}
        self._update_hash_map()

    def _update_hash_map(self):
        # Python dictionary is used as a Hash Map for ID lookup.
        self.task_map = {int(task["id"]): task for task in self.tasks}

    def _save(self):
        save_tasks(self.tasks)
        self._update_hash_map()

    def _take_snapshot(self):
        # Stack stores a copy of the task list before each change.
        self.undo_stack.append([task.copy() for task in self.tasks])

    def add_task(self, data):
        title = str(data.get("title", "")).strip()
        if not title:
            raise ValueError("Task title is required")

        self._take_snapshot()
        new_id = max((int(task["id"]) for task in self.tasks), default=0) + 1

        task = {
            "id": new_id,
            "title": title,
            "description": str(data.get("description", "")).strip(),
            "priority": data.get("priority", "medium"),
            "dueDate": data.get("dueDate", ""),
            "completed": False
        }

        if task["priority"] not in ("high", "medium", "low"):
            task["priority"] = "medium"

        self.tasks.append(task)
        self._save()
        return task

    def edit_task(self, task_id, data):
        task = self.task_map.get(int(task_id))
        if task is None:
            return None

        allowed = {"title", "description", "priority", "dueDate", "completed"}
        updates = {key: value for key, value in data.items() if key in allowed}

        if "title" in updates and not str(updates["title"]).strip():
            raise ValueError("Task title is required")
        if "priority" in updates and updates["priority"] not in ("high", "medium", "low"):
            raise ValueError("Priority must be high, medium, or low")

        self._take_snapshot()

        for key, value in updates.items():
            if key in ("title", "description"):
                value = str(value).strip()
            if key == "completed":
                value = bool(value)
            task[key] = value

        self._save()
        return task

    def delete_task(self, task_id):
        task = self.task_map.get(int(task_id))
        if task is None:
            return False

        self._take_snapshot()
        self.tasks = [
            item for item in self.tasks
            if int(item["id"]) != int(task_id)
        ]
        self._save()
        return True

    def get_task(self, task_id):
        # Binary Search by task ID.
        return binary_search(self.tasks, int(task_id))

    def get_all_tasks(self):
        return self.tasks.copy()

    def undo(self):
        if not self.undo_stack:
            return False

        self.tasks = self.undo_stack.pop()
        self._save()
        return True
