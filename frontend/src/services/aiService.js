import api from "./api";

export const suggestSources = ({ title, content, tags }) =>
  api.post("/ai/suggest-sources", { title, content, tags }).then((res) => res.data);
