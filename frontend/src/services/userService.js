import api from "./api";

export const getPublicProfile = (id) =>
  api.get(`/users/${id}`).then((res) => res.data);

export const followUser = (id) =>
  api.put(`/users/follow/${id}`).then((res) => res.data);

export const updateProfile = (formData) =>
  api
    .put("/users/profile", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);

export const updateLibraryVisibility = (visibility) =>
  api.put("/users/library/visibility", { visibility }).then((res) => res.data);

export const getUserLibrary = (id) =>
  api.get(`/users/${id}/library`).then((res) => res.data);

export const toggleFavoriteTag = (tagId) =>
  api.put(`/users/favorite-tag/${tagId}`).then((res) => res.data);

export const searchUsers = (q) =>
  api.get("/users/search", { params: { q } }).then((res) => res.data);

export const changePassword = (currentPassword, newPassword) =>
  api.put("/users/change-password", { currentPassword, newPassword }).then((res) => res.data);

export const deleteMyAccount = (password) =>
  api.delete("/users/me", { data: { password } }).then((res) => res.data);
