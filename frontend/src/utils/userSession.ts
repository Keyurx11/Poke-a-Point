// src/utils/userSession.ts

export const getUserId = (): string => {
  let userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  if (!userId) {
    userId = (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function')
      ? window.crypto.randomUUID().replace(/-/g, '').substring(0, 12)
      : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }
  localStorage.setItem('userId', userId);
  return userId;
};
