export const getToken = (): string => {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  if (!tokenCookie) {
    throw new Error('No access token found');
  }
  return tokenCookie.split('=')[1];
}; 