// src/utils/userSession.ts

export const getUserId = (): string => {
  let userId = sessionStorage.getItem('userId');
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('userId', userId);
  }
  return userId;
};
