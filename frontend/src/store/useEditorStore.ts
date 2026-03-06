import { create } from 'zustand';

export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  modified: boolean;
}

const MAIN_ID = 'main-sketch';

const DEFAULT_FILE: WorkspaceFile = {
  id: MAIN_ID,
  name: 'sketch.ino',
  content: `// Arduino Blink Example
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`,
  modified: false,
};

interface EditorState {
  files: WorkspaceFile[];
  activeFileId: string;
  openFileIds: string[];
  theme: 'vs-dark' | 'light';
  fontSize: number;

  // File operations
  createFile: (name: string) => string;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  setFileContent: (id: string, content: string) => void;
  markFileSaved: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  // Load a full set of files (e.g. when loading a saved project)
  loadFiles: (files: { name: string; content: string }[]) => void;

  // Settings
  setTheme: (theme: 'vs-dark' | 'light') => void;
  setFontSize: (size: number) => void;

  // Legacy compat — sets content of the active file
  setCode: (code: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: [DEFAULT_FILE],
  activeFileId: MAIN_ID,
  openFileIds: [MAIN_ID],
  theme: 'vs-dark',
  fontSize: 14,

  createFile: (name: string) => {
    const id = crypto.randomUUID();
    const newFile: WorkspaceFile = { id, name, content: '', modified: false };
    set((s) => ({
      files: [...s.files, newFile],
      openFileIds: [...s.openFileIds, id],
      activeFileId: id,
    }));
    return id;
  },

  deleteFile: (id: string) => {
    set((s) => {
      const files = s.files.filter((f) => f.id !== id);
      const openFileIds = s.openFileIds.filter((fid) => fid !== id);
      let activeFileId = s.activeFileId;
      if (activeFileId === id) {
        const idx = s.openFileIds.indexOf(id);
        activeFileId =
          openFileIds[idx] ??
          openFileIds[idx - 1] ??
          openFileIds[0] ??
          files[0]?.id ??
          '';
      }
      return { files, openFileIds, activeFileId };
    });
  },

  renameFile: (id: string, newName: string) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, name: newName, modified: true } : f
      ),
    }));
  },

  setFileContent: (id: string, content: string) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, content, modified: true } : f
      ),
    }));
  },

  markFileSaved: (id: string) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, modified: false } : f
      ),
    }));
  },

  openFile: (id: string) => {
    set((s) => ({
      openFileIds: s.openFileIds.includes(id)
        ? s.openFileIds
        : [...s.openFileIds, id],
      activeFileId: id,
    }));
  },

  closeFile: (id: string) => {
    set((s) => {
      const openFileIds = s.openFileIds.filter((fid) => fid !== id);
      let activeFileId = s.activeFileId;
      if (activeFileId === id) {
        const idx = s.openFileIds.indexOf(id);
        activeFileId =
          openFileIds[idx] ?? openFileIds[idx - 1] ?? openFileIds[0] ?? '';
      }
      return { openFileIds, activeFileId };
    });
  },

  setActiveFile: (id: string) => set({ activeFileId: id }),

  loadFiles: (incoming: { name: string; content: string }[]) => {
    const files: WorkspaceFile[] = incoming.map((f, i) => ({
      id: i === 0 ? MAIN_ID : crypto.randomUUID(),
      name: f.name,
      content: f.content,
      modified: false,
    }));
    const firstId = files[0]?.id ?? MAIN_ID;
    set({
      files,
      activeFileId: firstId,
      openFileIds: [firstId],
    });
  },

  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),

  // Legacy: sets content of active file
  setCode: (code: string) => {
    const { activeFileId, setFileContent } = get();
    if (activeFileId) setFileContent(activeFileId, code);
  },
}));
