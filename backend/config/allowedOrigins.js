// CORS izin listesi — hem Express (server.js) hem Socket.IO (chatSocket.js)
// aynı listeyi kullanır, tek yerden yönetilsin diye.
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(Boolean);

export default allowedOrigins;
