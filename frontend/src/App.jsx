import { Suspense, lazy } from "react";
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
import Notes from "./pages/Notes";

// WriteArticle (@uiw/react-md-editor'ı içeriyor — bundle'ın büyük kısmı) ve
// AdminPanel (nadiren ziyaret edilen, admin-özel) lazy yükleniyor — Dashboard
// gibi sık ziyaret edilen sayfalar artık bunları hiç indirmiyor, sadece
// gerçekten o sayfaya gidildiğinde ayrı bir JS parçası (chunk) olarak gelir.
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const WriteArticle = lazy(() => import("./pages/WriteArticle"));

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
            <Route path="/notes" element={<Notes />} />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<p className="text-sm text-gray-500">Yükleniyor...</p>}>
                  <AdminPanel />
                </Suspense>
              }
            />
            <Route
              path="/write"
              element={
                <Suspense fallback={<p className="text-sm text-gray-500">Yükleniyor...</p>}>
                  <WriteArticle />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
