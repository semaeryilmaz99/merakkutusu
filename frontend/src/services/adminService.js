import api from "./api";

export const getAllUsers = (page = 1) =>
  api.get("/admin/users", { params: { page } }).then((res) => res.data);

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then((res) => res.data);

export const getUserActivity = (id) =>
  api.get(`/admin/users/${id}/activity`).then((res) => res.data);
