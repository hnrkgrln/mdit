import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ConnectionState {
  sessionId: string | null;
  connectedMachineName: string | null;
  machines: Array<{
    machineName: string;
    host: string;
    port?: number;
    username: string;
  }>;
}

export interface ConnectionActions {
  setSessionId: (sessionId: string | null) => void;
  setConnectedMachineName: (name: string | null) => void;
  addMachine: (machine: { machineName: string; host: string; port?: number; username: string }) => void;
  removeMachine: (machineName: string) => void;
  disconnect: () => void;
}

export type ConnectionStore = ConnectionState & ConnectionActions;

const initialConnectionState: ConnectionState = {
  sessionId: null,
  connectedMachineName: null,
  machines: [],
};

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      ...initialConnectionState,
      
      setSessionId: (sessionId) => set({ sessionId }),
      setConnectedMachineName: (connectedMachineName) => set({ connectedMachineName }),
      addMachine: (machine) => set((state) => {
        const filtered = state.machines.filter(
          m => m.machineName !== machine.machineName && m.host !== machine.host
        );
        return { machines: [...filtered, machine] };
      }),
      removeMachine: (machineName) => set((state) => ({
        machines: state.machines.filter(m => m.machineName !== machineName),
      })),
      disconnect: () => set({
        sessionId: null,
        connectedMachineName: null,
      }),
    }),
    {
      name: 'mdit-connection-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        machines: state.machines,
      }),
    }
  )
);
