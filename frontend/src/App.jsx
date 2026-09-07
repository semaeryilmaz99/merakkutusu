import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SelectInterests from "./pages/SelectInterests";
import UserPage from "./pages/UserPage";
import ArticleDetail from "./pages/ArticleDetail";
import PublicProfile from "./pages/PublicProfile";
import Explore from "./pages/Explore";
import CategoryDetail from "./pages/CategoryDetail";
import Library from "./pages/Library";
import AdminPanel from "./pages/AdminPanel";
import WriteArticle from "./pages/WriteArticle";
import Notes from "./pages/Notes";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<RequireAuth />}>
          <Route path="/select-interests" element={<SelectInterests />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/userpage" element={<UserPage />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/users/:id" element={<PublicProfile />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:tagName" element={<CategoryDetail />} />
            <Route path="/library" element={<Library />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/write" element={<WriteArticle />} />
            <Route path="/notes" element={<Notes />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
