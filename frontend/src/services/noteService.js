import api from "./api";

export const createNote = (formData) =>
  api.post("/notes", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data);

export const getMyNotes = (page = 1) =>
  api.get("/notes", { params: { page } }).then((res) => res.data);

export const getNoteById = (id) =>
  api.get(`/notes/${id}`).then((res) => res.data);

export const deleteNote = (id) =>
  api.delete(`/notes/${id}`).then((res) => res.data);
