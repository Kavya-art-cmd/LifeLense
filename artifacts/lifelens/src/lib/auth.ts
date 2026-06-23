export function isAuthenticated() {
  return localStorage.getItem("lifelens_auth_token") !== null;
}

export function login(token: string) {
  localStorage.setItem("lifelens_auth_token", token);
}

export function logout() {
  localStorage.removeItem("lifelens_auth_token");
}
