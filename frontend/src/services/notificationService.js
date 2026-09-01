import api from "./api";

export const getNotifications = () =>
  api.get("/notifications").then((res) => res.data);

export const markAsRead = (id) =>
  api.put(`/notifications/${id}/read`).then((res) => res.data);
