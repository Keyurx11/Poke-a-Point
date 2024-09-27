// backend/src/types.ts
export interface Room {
    id: string;
    name: string;
    users: User[];
    votes: { [key: string]: number };
  }
  
  export interface User {
    id: string;
    name: string;
    socketId: string;
  }
  