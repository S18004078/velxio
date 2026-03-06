import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import './FileExplorer.css';

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'ino') return '⚡';
  if (['cpp', 'c', 'cc'].includes(ext)) return '📄';
  if (['h', 'hpp'].includes(ext)) return '📋';
  if (ext === 'json') return '{}';
  return '📝';
}

interface ContextMenu {
  fileId: string;
  x: number;
  y: number;
}

export const FileExplorer: React.FC = () => {
  const { files, activeFileId, openFile, createFile, deleteFile, renameFile } =
    useEditorStore();
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (creatingFile && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [creatingFile]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ fileId, x: e.clientX, y: e.clientY });
  };

  const startRename = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    setRenamingId(fileId);
    setRenameValue(file.name);
    setContextMenu(null);
  };

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameFile(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, renameFile]);

  const handleDelete = (fileId: string) => {
    setContextMenu(null);
    if (files.length <= 1) return;
    if (!window.confirm('Delete this file?')) return;
    deleteFile(fileId);
  };

  const startCreateFile = () => {
    setCreatingFile(true);
    setNewFileName('');
    setContextMenu(null);
  };

  const commitCreateFile = useCallback(() => {
    const name = newFileName.trim();
    if (name) createFile(name);
    setCreatingFile(false);
    setNewFileName('');
  }, [newFileName, createFile]);

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span className="file-explorer-title">WORKSPACE</span>
        <button
          className="file-explorer-new-btn"
          title="New File"
          onClick={startCreateFile}
        >
          +
        </button>
      </div>

      <div className="file-explorer-list">
        {files.map((file) => (
          <div
            key={file.id}
            className={`file-explorer-item${file.id === activeFileId ? ' file-explorer-item-active' : ''}`}
            onClick={() => openFile(file.id)}
            onContextMenu={(e) => handleContextMenu(e, file.id)}
            onDoubleClick={() => startRename(file.id)}
            title={`${file.name}${file.modified ? ' (unsaved)' : ''}`}
          >
            <span className="file-explorer-icon">{getFileIcon(file.name)}</span>

            {renamingId === file.id ? (
              <input
                ref={renameInputRef}
                className="file-explorer-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="file-explorer-name">{file.name}</span>
            )}

            {file.modified && (
              <span className="file-explorer-dot" title="Unsaved changes">
                ●
              </span>
            )}
          </div>
        ))}

        {creatingFile && (
          <div className="file-explorer-item file-explorer-item-new">
            <span className="file-explorer-icon">⚡</span>
            <input
              ref={newFileInputRef}
              className="file-explorer-rename-input"
              value={newFileName}
              placeholder="filename.ino"
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={commitCreateFile}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCreateFile();
                if (e.key === 'Escape') {
                  setCreatingFile(false);
                  setNewFileName('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="file-explorer-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => startRename(contextMenu.fileId)}>
            Rename
          </button>
          <button
            className="ctx-delete"
            onClick={() => handleDelete(contextMenu.fileId)}
            disabled={files.length <= 1}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
