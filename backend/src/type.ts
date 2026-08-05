export interface User {
  id: string; // persistent userId
  name: string;
  socketId: string;
}

export interface Room {
  id: string;
  name: string;
  creatorId: string; // persistent userId of room creator
  users: User[];
  votes: { [userId: string]: number | string | null };
  showVotes: boolean;
  votingOptions: (number | string)[];
}
