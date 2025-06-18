export interface Account {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  avatarUrl: string;
}

const user: Account = JSON.parse(localStorage.getItem("user") || "{}");

export default user;
