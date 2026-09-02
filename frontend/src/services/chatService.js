import api from "./api";

export const getOrCreateDashboardRoom = () =>
  api.post("/chat/rooms/dashboard").then((res) => res.data);

export const getOrCreateArticleRoom = (articleId) =>
  api.post(`/chat/rooms/article/${articleId}`).then((res) => res.data);

export const getOrCreateDirectRoom = (userId) =>
  api.post(`/chat/rooms/direct/${userId}`).then((res) => res.data);

export const getRoomMessages = (roomId) =>
  api.get(`/chat/rooms/${roomId}/messages`).then((res) => res.data);

export const uploadChatImage = (formData) =>
  api
    .post("/chat/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);
