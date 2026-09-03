import api from "./api";

export const getAllUsers = () =>
  api.get("/admin/users").then((res) => res.data);

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then((res) => res.data);

export const getUserActivity = (id) =>
  api.get(`/admin/users/${id}/activity`).then((res) => res.data);
