import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceData } from '../shared/schema.js';

contextBridge.exposeInMainWorld('zettel', {
  load: (): Promise<WorkspaceData> => ipcRenderer.invoke('zettel:load'),
  save: (data: WorkspaceData, expectedRevision: number): Promise<WorkspaceData> => ipcRenderer.invoke('zettel:save', data, expectedRevision),
  propose: (prompt: string) => ipcRenderer.invoke('zettel:propose', prompt),
  info: (): Promise<{ aiConfigured: boolean; storagePath?: string }> => ipcRenderer.invoke('zettel:info'),
});
