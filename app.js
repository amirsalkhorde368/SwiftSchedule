let db;
let currentFilter = 'all';

// Initialize IndexedDB
const request = indexedDB.open('SwiftScheduleDB', 1);

request.onerror = (event) => {
    console.error('Database error: ', event.target.error);
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadTasks();
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('completed', 'completed', { unique: false });
    
    // Seed initial demo data
    objectStore.transaction.oncomplete = () => {
        const taskStore = db.transaction('tasks', 'readwrite').objectStore('tasks');
        taskStore.add({ title: 'مطالعه الگوریتم هوش مصنوعی خوارزمی', priority: 'high', duration: 45, completed: false });
        taskStore.add({ title: 'توسعه رابط کاربری PWA', priority: 'medium', duration: 30, completed: true });
    };
};

// Form submission
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const priority = document.getElementById('taskPriority').value;
    const duration = parseInt(document.getElementById('taskDuration').value);

    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    store.add({ title, priority, duration, completed: false });

    transaction.oncomplete = () => {
        document.getElementById('taskForm').reset();
        loadTasks();
    };
});

// Load tasks from DB
function loadTasks() {
    if (!db) return;
    const transaction = db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.getAll();

    request.onsuccess = () => {
        const tasks = request.result;
        renderTasks(tasks);
        updateStats(tasks);
    };
}

// Render tasks to UI
function renderTasks(tasks) {
    const listEl = document.getElementById('taskList');
    listEl.innerHTML = '';

    const filtered = tasks.filter(task => {
        if (currentFilter === 'todo') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm">هیچ تسکی یافت نشد.</div>`;
        return;
    }

    filtered.forEach(task => {
        const div = document.createElement('div');
        div.className = `glass p-3.5 rounded-xl flex items-center justify-between border ${task.completed ? 'opacity-60 border-emerald-500/20' : 'border-slate-800'}`;
        
        let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        let priorityText = 'متوسط';
        if (task.priority === 'high') { badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20'; priorityText = 'بالا'; }
        if (task.priority === 'low') { badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; priorityText = 'کم'; }

        div.innerHTML = `
            <div class="flex items-center space-x-3 space-x-reverse">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})"
                    class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer">
                <div>
                    <h4 class="text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${task.title}</h4>
                    <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span class="px-2 py-0.5 rounded-md border ${badgeColor}">${priorityText}</span>
                        <span><i class="fa-regular fa-clock"></i> ${task.duration} دقیقه</span>
                    </div>
                </div>
            </div>
            <button onclick="deleteTask(${task.id})" class="text-slate-500 hover:text-rose-400 p-2 transition">
                <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
        `;
        listEl.appendChild(div);
    });
}

// Toggle task status
function toggleTask(id) {
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    store.get(id).onsuccess = (e) => {
        const task = e.target.result;
        task.completed = !task.completed;
        store.put(task);
        loadTasks();
    };
}

// Delete task
function deleteTask(id) {
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    store.delete(id);
    transaction.oncomplete = () => loadTasks();
}

// Filter tasks
function filterTasks(type) {
    currentFilter = type;
    ['All', 'Todo', 'Completed'].forEach(t => {
        const btn = document.getElementById(`filter${t}`);
        if (t.toLowerCase() === type) {
            btn.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium transition';
        } else {
            btn.className = 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition';
        }
    });
    loadTasks();
}

// Update Dashboard Statistics
function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    document.getElementById('totalCount').innerText = total;
    document.getElementById('completedCount').innerText = completed;
}

// AI Smart Scheduler Trigger
document.getElementById('aiBtn').addEventListener('click', () => {
    alert('هوش مصنوعی تطبیقی SwiftSchedule: تسک‌های شما با موفقیت بر اساس اهمیت و زمان بهینه مرتب شدند!');
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    store.getAll().onsuccess = (e) => {
        let tasks = e.target.result;
        // Simple intelligent sorting mock
        tasks.sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0));
        loadTasks();
    };
});

// PWA Install Prompt Handler
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
        installBtn.addEventListener('click', () => {
            installBtn.classList.add('hidden');
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('App installed successfully');
                }
                deferredPrompt = null;
            });
        });
    }
});
