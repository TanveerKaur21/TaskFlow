# TaskFlow - Advanced Data Structures and Algorithms

PRIORITY_RANK = {"high": 1, "medium": 2, "low": 3}


# 1. Insertion Sort: sort tasks by priority
def insertion_sort(tasks):
    result = tasks.copy()

    for i in range(1, len(result)):
        current = result[i]
        j = i - 1

        while j >= 0 and (
            PRIORITY_RANK.get(result[j].get("priority"), 4)
            > PRIORITY_RANK.get(current.get("priority"), 4)
        ):
            result[j + 1] = result[j]
            j -= 1

        result[j + 1] = current

    return result


# 2. Merge Sort: sort tasks by due date
def merge_sort(tasks):
    if len(tasks) <= 1:
        return tasks.copy()

    middle = len(tasks) // 2
    left = merge_sort(tasks[:middle])
    right = merge_sort(tasks[middle:])

    return _merge_by_deadline(left, right)


def _merge_by_deadline(left, right):
    merged = []
    i = j = 0

    while i < len(left) and j < len(right):
        date_left = left[i].get("dueDate") or "9999-12-31"
        date_right = right[j].get("dueDate") or "9999-12-31"

        if date_left <= date_right:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1

    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged


# 3. Linear Search: search title and description
def linear_search(tasks, keyword):
    keyword = keyword.casefold()

    if not keyword:
        return tasks.copy()

    return [
        task for task in tasks
        if keyword in task.get("title", "").casefold()
        or keyword in task.get("description", "").casefold()
        or keyword in str(task.get("id", ""))
    ]


# 4. Binary Search: find task by ID
def binary_search(tasks, task_id):
    ordered = sorted(tasks, key=lambda task: int(task["id"]))
    low, high = 0, len(ordered) - 1

    while low <= high:
        middle = (low + high) // 2
        current_id = int(ordered[middle]["id"])

        if current_id == int(task_id):
            return ordered[middle]
        if current_id < int(task_id):
            low = middle + 1
        else:
            high = middle - 1

    return None


# 5. Binary Min-Heap
class MinHeap:
    def __init__(self):
        self.heap = []

    @staticmethod
    def _key(task):
        return (
            PRIORITY_RANK.get(task.get("priority"), 4),
            task.get("dueDate") or "9999-12-31",
            int(task.get("id", 0))
        )

    def insert(self, task):
        self.heap.append(task)
        self._heapify_up(len(self.heap) - 1)

    def _heapify_up(self, index):
        while index > 0:
            parent = (index - 1) // 2
            if self._key(self.heap[index]) < self._key(self.heap[parent]):
                self.heap[index], self.heap[parent] = (
                    self.heap[parent], self.heap[index]
                )
                index = parent
            else:
                break

    def _heapify_down(self, index):
        size = len(self.heap)

        while True:
            smallest = index
            left = 2 * index + 1
            right = 2 * index + 2

            if left < size and self._key(self.heap[left]) < self._key(self.heap[smallest]):
                smallest = left

            if right < size and self._key(self.heap[right]) < self._key(self.heap[smallest]):
                smallest = right

            if smallest == index:
                break

            self.heap[index], self.heap[smallest] = (
                self.heap[smallest], self.heap[index]
            )
            index = smallest

    def extract_min(self):
        if not self.heap:
            return None

        if len(self.heap) == 1:
            return self.heap.pop()

        minimum = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._heapify_down(0)
        return minimum


# 6. Priority Queue implemented using Binary Min-Heap
class PriorityQueue:
    def __init__(self):
        self.min_heap = MinHeap()

    def enqueue(self, task):
        self.min_heap.insert(task)

    def dequeue(self):
        return self.min_heap.extract_min()

    def is_empty(self):
        return len(self.min_heap.heap) == 0


def priority_queue_sort(tasks):
    queue = PriorityQueue()

    for task in tasks:
        queue.enqueue(task)

    ordered = []
    while not queue.is_empty():
        ordered.append(queue.dequeue())

    return ordered
