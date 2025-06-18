import { jwtDecode } from "jwt-decode";

const getCookie = (cookieName) => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName + '=')) {
      return cookie.substring(cookieName.length + 1);
    }
  }
  return '';
}

export const token = getCookie('accessToken') || '';

const validate = () => {
  try {
    return jwtDecode(token);
  } catch (error) {
    return {};
  }
}

const { username, sub, image } = validate();
const result = {username, sub, image};
export const decodeToken = result;
