# TaskFlow - Flask API and frontend server
import os
from flask import Flask, request, jsonify, send_from_directory

from task_manager import TaskManager
from algorithms import (
    insertion_sort,
    merge_sort,
    linear_search,
    priority_queue_sort
)

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manager = TaskManager()


@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/style.css")
def css():
    return send_from_directory(BASE_DIR, "style.css")


@app.route("/app.js")
def javascript():
    return send_from_directory(BASE_DIR, "app.js")


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    result = manager.get_all_tasks()

    search = request.args.get("search", "").strip()
    sort = request.args.get("sort", "newest")

    if search:
        result = linear_search(result, search)

    if sort == "priority":
        result = insertion_sort(result)
    elif sort == "deadline":
        result = merge_sort(result)
    elif sort == "queue":
        result = priority_queue_sort(result)

    return jsonify(result)


@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}
    try:
        task = manager.add_task(data)
        return jsonify(task), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@app.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = manager.get_task(task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task)


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    try:
        task = manager.edit_task(task_id, data)
        if task is None:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    if not manager.delete_task(task_id):
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"message": "Task deleted successfully"})


@app.route("/api/undo", methods=["POST"])
def undo():
    if not manager.undo():
        return jsonify({"error": "Nothing to undo"}), 400

    return jsonify({
        "message": "Last action undone",
        "tasks": manager.get_all_tasks()
    })


if __name__ == "__main__":
    print("TaskFlow Python Backend Started!")
    app.run(debug=True)
