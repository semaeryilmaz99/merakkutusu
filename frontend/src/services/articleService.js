import api from "./api";

export const createArticle = (formData) =>
  api
    .post("/articles", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);

export const getPersonalizedFeed = () =>
  api.get("/articles/feed/personalized").then((res) => res.data);

export const searchArticles = ({ q, tags } = {}) =>
  api.get("/articles/search", { params: { q, tags } }).then((res) => res.data);

export const getMyLibrary = () =>
  api.get("/users/library").then((res) => res.data);

export const getArticleById = (id) =>
  api.get(`/articles/${id}`).then((res) => res.data);

export const toggleFavorite = (id) =>
  api.put(`/articles/favorite/${id}`).then((res) => res.data);

export const toggleLibrary = (id) =>
  api.put(`/users/library/${id}`).then((res) => res.data);

export const addComment = (id, text) =>
  api.post(`/articles/${id}/comment`, { text }).then((res) => res.data);

export const getExploreFeed = () =>
  api.get("/articles/explore").then((res) => res.data);

export const getCategories = () =>
  api.get("/articles/categories").then((res) => res.data);

export const filterByTag = (tag) =>
  api.get("/articles/filter", { params: { tag } }).then((res) => res.data);

export const getArticlesByAuthor = (id) =>
  api.get(`/articles/author/${id}`).then((res) => res.data);

export const deleteArticle = (id) =>
  api.delete(`/articles/${id}`).then((res) => res.data);

export const updateArticle = (id, formData) =>
  api
    .put(`/articles/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);

export const getTrendingArticles = () =>
  api.get("/articles/trending").then((res) => res.data);

export const getTrendingTags = () =>
  api.get("/articles/trending-tags").then((res) => res.data);
