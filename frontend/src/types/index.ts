export interface Match {
  id: string;
  username: string;
  interests: string[];
  matchPercentage: number;
  lastMessage?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface User {
  id: string;
  username: string;
  interests: string[];
}