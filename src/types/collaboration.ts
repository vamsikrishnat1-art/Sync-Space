export interface UserPresence {
  id: string | number;
  name: string;
  color: string;
  colorLight: string;
  avatar?: string;
  cursor?: {
    anchor: number;
    head: number;
  } | null;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface CollaborationState {
  status: ConnectionStatus;
  synced: boolean;
  activeUsers: UserPresence[];
  currentUser: UserPresence;
  title: string;
  updateTitle: (title: string) => void;
  reconnect: () => void;
  disconnect: () => void;
  toggleConnection: () => void;
  updateUserName: (name: string) => void;
  updateUserColor: (color: string) => void;
}
