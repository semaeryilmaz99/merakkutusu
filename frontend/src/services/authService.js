import api from "./api";

export const register = (username, email, password) =>
  api.post("/auth/register", { username, email, password }).then((res) => res.data);

export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const verifyEmail = (token) =>
  api.get(`/auth/verify/${token}`).then((res) => res.data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((res) => res.data);

export const resetPassword = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password }).then((res) => res.data);

export const logout = () =>
  api.post("/auth/logout").then((res) => res.data);

export const getMe = () =>
  api.get("/users/me").then((res) => res.data);
