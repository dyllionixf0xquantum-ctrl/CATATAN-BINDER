// ===== Storage =====
const STORAGE_KEY = "binder.v2";
const COLORS = ["#7cf6ab", "#242f7c", "#8baa27", "#8e1010", "#623c7a", "#5C7A4B","#ff0800","#00d9ff","#1fff02","#ff048e", "#6c4095"];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { binders: [], notes: [] };
    const parsed = JSON.parse(raw);
    return {
      binders: Array.isArray(parsed.binders) ? parsed.binders : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch (e) {
    console.error("Gagal memuat data, mulai kosong.", e);
    return { binders: [], notes: [] };
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    return true;
  } catch (e) {
    console.error("Gagal menyimpan (mungkin penyimpanan penuh).", e);
    showToast("Gagal menyimpan. Penyimpanan perangkat mungkin penuh.");
    return false;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== State =====
const state = {
  data: loadData(),
  activeBinderId: null,
  activeNoteId: null,
  view: "binders", // binders | notes | editor  (mobile drill-down)
};

// ===== DOM refs =====
const $ = (id) => document.getElementById(id);
const appEl = $("app");
const binderList = $("binderList");
const binderEmpty = $("binderEmpty");
const notesTitle = $("notesTitle");
const noteList = $("noteList");
const noteEmpty = $("noteEmpty");
const searchNotes = $("searchNotes");
const noteTitleInput = $("noteTitleInput");
const noteBody = $("noteBody");
const noteMeta = $("noteMeta");
const saveState = $("saveState");
const editorEmpty = $("editorEmpty");
const storageInfo = $("storageInfo");

// ===== Rendering =====
function render() {
  renderBinders();
  renderNotes();
  renderEditor();
  appEl.className = "app view-" + state.view;
  renderStorageInfo();
}

function renderBinders() {
  binderList.innerHTML = "";
  const binders = state.data.binders;
  binderEmpty.classList.toggle("hidden", binders.length > 0);
  binders.forEach((b) => {
    const count = state.data.notes.filter((n) => n.binderId === b.id).length;
    const li = document.createElement("li");
    li.className = "binder-item" + (b.id === state.activeBinderId ? " active" : "");
    li.style.setProperty("--spine", b.color);
    li.innerHTML = `
      <span class="binder-spine"></span>
      <span class="binder-name"></span>
      <span class="binder-count">${count}</span>
      <button class="binder-edit" title="Edit binder" aria-label="Edit binder">✎</button>
    `;
    li.querySelector(".binder-name").textContent = b.name;
    li.addEventListener("click", (e) => {
      if (e.target.closest(".binder-edit")) return;
      openBinder(b.id);
    });
    li.querySelector(".binder-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      openBinderDialog(b);
    });
    binderList.appendChild(li);
  });
}

function renderNotes() {
  const binder = state.data.binders.find((b) => b.id === state.activeBinderId);
  notesTitle.textContent = binder ? binder.name : "Pilih binder";
  noteList.innerHTML = "";

  if (!binder) {
    noteEmpty.classList.add("hidden");
    return;
  }

  const query = searchNotes.value.trim().toLowerCase();
  let notes = state.data.notes
    .filter((n) => n.binderId === binder.id)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (query) {
    notes = notes.filter(
      (n) => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query)
    );
  }

  noteEmpty.classList.toggle("hidden", notes.length > 0);
  notes.forEach((n) => {
    const li = document.createElement("li");
    li.className = "note-item" + (n.id === state.activeNoteId ? " active" : "");
    const snippet = n.body.trim().slice(0, 80).replace(/\n/g, " ");
    li.innerHTML = `
      <div class="note-item-title"></div>
      <div class="note-item-snippet"></div>
      <div class="note-item-date">${formatDate(n.updatedAt)}</div>
    `;
    li.querySelector(".note-item-title").textContent = n.title || "(Tanpa judul)";
    li.querySelector(".note-item-snippet").textContent = snippet;
    li.addEventListener("click", () => openNote(n.id));
    noteList.appendChild(li);
  });
}

function renderEditor() {
  const note = state.data.notes.find((n) => n.id === state.activeNoteId);
  const hasNote = !!note;
  editorEmpty.classList.toggle("hidden", hasNote);
  noteTitleInput.classList.toggle("hidden", !hasNote);
  noteBody.classList.toggle("hidden", !hasNote);
  $("btnDeleteNote").classList.toggle("hidden", !hasNote);
  $("noteMeta").classList.toggle("hidden", !hasNote);

  if (!hasNote) return;
  if (document.activeElement !== noteTitleInput) noteTitleInput.value = note.title;
  if (document.activeElement !== noteBody) noteBody.value = note.body;
  noteMeta.textContent = "Diperbarui " + formatDate(note.updatedAt);
}

function renderStorageInfo() {
  const kb = Math.round((JSON.stringify(state.data).length / 1024) * 10) / 10;
  storageInfo.textContent = `${state.data.notes.length} catatan · ${kb} KB tersimpan di perangkat ini`;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ===== Navigation =====
function setView(v) {
  state.view = v;
  render();
}

function openBinder(id) {
  state.activeBinderId = id;
  state.activeNoteId = null;
  searchNotes.value = "";
  setView("notes");
}

function openNote(id) {
  state.activeNoteId = id;
  setView("editor");
}

$("btnBackToBinders").addEventListener("click", () => setView("binders"));
$("btnBackToNotes").addEventListener("click", () => setView("notes"));

// on wide screens all panels are visible; clicking a binder should still load its notes
window.addEventListener("resize", render);

// ===== Binder CRUD =====
let editingBinderId = null;

$("btnAddBinder").addEventListener("click", () => openBinderDialog(null));

function openBinderDialog(binder) {
  editingBinderId = binder ? binder.id : null;
  $("binderDialogTitle").textContent = binder ? "Edit binder" : "Binder baru";
  $("binderNameInput").value = binder ? binder.name : "";
  $("btnDeleteBinder").classList.toggle("hidden", !binder);
  buildColorPicker(binder ? binder.color : COLORS[state.data.binders.length % COLORS.length]);
  $("binderDialog").classList.remove("hidden");
  setTimeout(() => $("binderNameInput").focus(), 0);
}

function buildColorPicker(selected) {
  const picker = $("colorPicker");
  picker.innerHTML = "";
  COLORS.forEach((c) => {
    const sw = document.createElement("button");
    sw.type = "button";
    sw.className = "color-swatch" + (c === selected ? " selected" : "");
    sw.style.background = c;
    sw.dataset.color = c;
    sw.addEventListener("click", () => {
      picker.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("selected"));
      sw.classList.add("selected");
    });
    picker.appendChild(sw);
  });
}

$("btnCancelBinder").addEventListener("click", () => $("binderDialog").classList.add("hidden"));

$("btnSaveBinder").addEventListener("click", () => {
  const name = $("binderNameInput").value.trim();
  if (!name) { showToast("Nama binder tidak boleh kosong."); return; }
  const color = $("colorPicker").querySelector(".selected")?.dataset.color || COLORS[0];

  if (editingBinderId) {
    const b = state.data.binders.find((x) => x.id === editingBinderId);
    b.name = name;
    b.color = color;
  } else {
    const b = { id: uid(), name, color, createdAt: Date.now() };
    state.data.binders.push(b);
    state.activeBinderId = b.id;
  }
  saveData();
  $("binderDialog").classList.add("hidden");
  render();
});

$("btnDeleteBinder").addEventListener("click", () => {
  if (!editingBinderId) return;
  const noteCount = state.data.notes.filter((n) => n.binderId === editingBinderId).length;
  if (!confirm(`Hapus binder ini beserta ${noteCount} catatan di dalamnya? Tindakan ini tidak bisa dibatalkan.`)) return;
  state.data.binders = state.data.binders.filter((b) => b.id !== editingBinderId);
  state.data.notes = state.data.notes.filter((n) => n.binderId !== editingBinderId);
  if (state.activeBinderId === editingBinderId) {
    state.activeBinderId = null;
    state.activeNoteId = null;
    setView("binders");
  }
  saveData();
  $("binderDialog").classList.add("hidden");
  render();
});

// ===== Note CRUD =====
$("btnAddNote").addEventListener("click", () => {
  if (!state.activeBinderId) { showToast("Pilih atau buat binder dulu."); return; }
  const n = {
    id: uid(),
    binderId: state.activeBinderId,
    title: "",
    body: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.data.notes.push(n);
  state.activeNoteId = n.id;
  saveData();
  setView("editor");
  setTimeout(() => noteTitleInput.focus(), 0);
});

$("btnDeleteNote").addEventListener("click", () => {
  if (!state.activeNoteId) return;
  if (!confirm("Hapus catatan ini?")) return;
  state.data.notes = state.data.notes.filter((n) => n.id !== state.activeNoteId);
  state.activeNoteId = null;
  saveData();
  setView("notes");
});

let saveTimer = null;
function scheduleSave() {
  saveState.textContent = "Menyimpan…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const note = state.data.notes.find((n) => n.id === state.activeNoteId);
    if (note) {
      note.title = noteTitleInput.value;
      note.body = noteBody.value;
      note.updatedAt = Date.now();
      saveData();
      noteMeta.textContent = "Diperbarui " + formatDate(note.updatedAt);
      renderNotes();
      renderBinders();
    }
    saveState.textContent = "Tersimpan";
    renderStorageInfo();
  }, 400);
}
noteTitleInput.addEventListener("input", scheduleSave);
noteBody.addEventListener("input", scheduleSave);
searchNotes.addEventListener("input", renderNotes);

// ===== Export / Import =====
$("btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `binder-catatan-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$("btnImport").addEventListener("click", () => $("importFileInput").click());

$("importFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(reader.result);
      if (!Array.isArray(incoming.binders) || !Array.isArray(incoming.notes)) {
        throw new Error("Format tidak dikenali");
      }
      const mode = confirm(
        "OK = Gabungkan dengan data yang ada.\nBatal = Ganti semua data yang ada dengan file ini."
      );
      if (mode) {
        const existingBinderIds = new Set(state.data.binders.map((b) => b.id));
        incoming.binders.forEach((b) => { if (!existingBinderIds.has(b.id)) state.data.binders.push(b); });
        const existingNoteIds = new Set(state.data.notes.map((n) => n.id));
        incoming.notes.forEach((n) => { if (!existingNoteIds.has(n.id)) state.data.notes.push(n); });
      } else {
        state.data = { binders: incoming.binders, notes: incoming.notes };
      }
      state.activeBinderId = null;
      state.activeNoteId = null;
      saveData();
      setView("binders");
      showToast("Impor berhasil.");
    } catch (err) {
      showToast("Gagal impor: file tidak valid.");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}

// ===== Init =====
render();
if (state.data.binders.length === 0) {
  // small nudge for first-time users, no auto-dialog to keep it calm
}

// ===== Offline support (service worker) =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker gagal didaftarkan (offline mode tidak aktif):", err);
    });
  });
}
