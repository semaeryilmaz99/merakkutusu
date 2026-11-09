import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";

// Her sayfa ayrı bir chunk olarak lazy yükleniyor — tek bir Suspense sınırı
// (aşağıda <Routes>'u sarıyor) hepsini kapsıyor. Önceden sadece Admin/Write
// lazy'ydi; geri kalan 13 sayfa TEK bir ana bundle'da toplanıyordu, yani Login
// ekranına gelen bir kullanıcı bile ArticleDetail'in markdown render'ını,
// framer-motion'ı, Notes/Chat bileşenlerini indiriyordu — hiç o sayfalara
// gitmese bile. Artık her sayfa sadece gerçekten ziyaret edildiğinde iner.
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SelectInterests = lazy(() => import("./pages/SelectInterests"));
const UserPage = lazy(() => import("./pages/UserPage"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Explore = lazy(() => import("./pages/Explore"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const Library = lazy(() => import("./pages/Library"));
const Notes = lazy(() => import("./pages/Notes"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const WriteArticle = lazy(() => import("./pages/WriteArticle"));

function App() {
  return (
    <Router>
      <Suspense fallback={<p className="p-6 text-sm text-gray-500">Yükleniyor...</p>}>
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
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/write" element={<WriteArticle />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
