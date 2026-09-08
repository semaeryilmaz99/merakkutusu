import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getArticlesByAuthor } from "../services/articleService";
import {
  updateProfile,
  updateLibraryVisibility,
  toggleFavoriteTag,
  changePassword,
  deleteMyAccount,
} from "../services/userService";
import ArticleCard from "../components/ArticleCard";
import Modal from "../components/UI/Modal";
import Button from "../components/UI/Button";
import StatPill from "../components/UI/StatPill";

export default function UserPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [favoriteTags, setFavoriteTags] = useState(user?.favoriteTags || []);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    getArticlesByAuthor(user._id)
      .then(setArticles)
      .finally(() => setIsLoadingArticles(false));
  }, [user?._id]);

  useEffect(() => {
    setFavoriteTags(user?.favoriteTags || []);
  }, [user?.favoriteTags]);

  const handleRemoveTag = async (tagId) => {
    setFavoriteTags((prev) => prev.filter((t) => t._id !== tagId));
    await toggleFavoriteTag(tagId);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProfilePanel
        user={user}
        onOpenEdit={() => setIsEditOpen(true)}
        onOpenFollowers={() => setIsFollowersOpen(true)}
      />

      <div className="flex-1">
        <div className="mb-4 flex flex-wrap gap-2">
          {favoriteTags.length === 0 ? (
            <p className="text-sm text-gray-500">
              Henüz ilgi alanı seçmedin —{" "}
              <Link to="/select-interests" className="font-semibold text-brand-700 hover:underline">
                buradan seç
              </Link>
              .
            </p>
          ) : (
            favoriteTags.map((tag) => (
              <span
                key={tag._id}
                className="flex items-center gap-2 rounded-full bg-brand-700 px-3 py-1 text-xs font-medium text-white"
              >
                #{tag.name}
                <button
                  onClick={() => handleRemoveTag(tag._id)}
                  aria-label={`${tag.name} etiketini kaldır`}
                  className="rounded-full hover:bg-white/20"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>

        {isLoadingArticles ? (
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz makale yazmadın.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}
      </div>

      {isEditOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditOpen(false)}
          onSaved={refreshUser}
          onAccountDeleted={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        />
      )}

      {isFollowersOpen && (
        <FollowersModal followers={user.followers || []} onClose={() => setIsFollowersOpen(false)} />
      )}
    </div>
  );
}

function ProfilePanel({ user, onOpenEdit, onOpenFollowers }) {
  return (
    <div className="flex w-full flex-none flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center lg:w-72">
      <div className="h-20 w-20 overflow-hidden rounded-full bg-brand-400">
        {user.avatar && <img src={user.avatar} alt="" className="h-full w-full object-cover" />}
      </div>

      <p className="rounded-full bg-gray-100 px-4 py-1 text-sm font-semibold text-brand-900">
        {user.username}
      </p>

      <p className="rounded-2xl bg-gray-100 px-4 py-2 text-xs text-brand-800">
        {user.bio || "Henüz biyografi eklenmedi."}
      </p>

      <div className="flex gap-2">
        <StatPill label="takipçi" value={user.followers?.length ?? 0} onClick={onOpenFollowers} />
        <StatPill label="favori" value={user.favoritesCount ?? 0} />
        <StatPill label="makale" value={user.articlesCount ?? 0} />
      </div>

      <p className="mt-2 text-xs font-semibold text-brand-700">Takip edilen yazarlar</p>
      {user.following?.length === 0 ? (
        <p className="text-xs text-gray-400">Henüz kimseyi takip etmiyorsun.</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {user.following?.map((author) => (
            <Link
              key={author._id}
              to={`/users/${author._id}`}
              aria-label={author.username}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-semibold text-white"
            >
              {author.avatar ? (
                <img src={author.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                author.username?.[0]?.toUpperCase()
              )}
            </Link>
          ))}
        </div>
      )}

      <Button variant="gold" onClick={onOpenEdit} className="mt-2">
        Profil Bilgilerini Güncelle
      </Button>
    </div>
  );
}

function FollowersModal({ followers, onClose }) {
  return (
    <Modal title="Takipçiler" onClose={onClose}>
      {followers.length === 0 ? (
        <p className="text-center text-sm text-white/70">Henüz takipçin yok.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {followers.map((follower) => (
            <Link
              key={follower._id}
              to={`/users/${follower._id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl bg-white/10 p-2 hover:bg-white/20"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-semibold text-white">
                {follower.avatar ? (
                  <img src={follower.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  follower.username?.[0]?.toUpperCase()
                )}
              </div>
              <p className="text-sm font-medium text-white">{follower.username}</p>
            </Link>
          ))}
        </div>
      )}
    </Modal>
  );
}

function EditProfileModal({ user, onClose, onSaved, onAccountDeleted }) {
  const [bio, setBio] = useState(user.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [visibility, setVisibility] = useState(user.libraryVisibility || "private");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleVisibilityChange = async (next) => {
    setVisibility(next);
    await updateLibraryVisibility(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("bio", bio);
      if (avatarFile) formData.append("avatar", avatarFile);
      await updateProfile(formData);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Profil güncellenemedi, tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Şifre değiştirildi.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Şifre değiştirilemedi.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteMyAccount(deletePassword);
      await onAccountDeleted();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Hesap silinemedi.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal title="Profil Bilgilerini Güncelle" onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        <p className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
          Kullanıcı adı: <span className="font-semibold text-white">{user.username}</span>
        </p>

        <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white/20">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-white/70">Profil Resmi</span>
          )}
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Biyografi"
          className="w-full rounded-xl bg-white/10 p-3 text-sm text-white placeholder-white/50 outline-none"
        />
        <p className="w-full px-2 text-right text-[10px] text-white/50">{bio.length}/300</p>

        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-white/80">Kütüphane görünürlüğü</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleVisibilityChange("private")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                visibility === "private" ? "bg-accent-gold text-brand-900" : "bg-white/10 text-white"
              }`}
            >
              Gizli
            </button>
            <button
              onClick={() => handleVisibilityChange("public")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                visibility === "public" ? "bg-accent-gold text-brand-900" : "bg-white/10 text-white"
              }`}
            >
              Açık
            </button>
          </div>
        </div>

        {error && <p className="text-center text-sm text-accent-coral">{error}</p>}

        <Button variant="gold" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>

        <div className="w-full border-t border-white/20 pt-4">
          <p className="mb-2 text-xs font-semibold text-white/80">Şifre Değiştir</p>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mevcut şifre"
            autoComplete="current-password"
            className="mb-2 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifre"
            autoComplete="new-password"
            className="w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none"
          />
          {passwordError && <p className="mt-2 text-center text-xs text-accent-coral">{passwordError}</p>}
          {passwordSuccess && <p className="mt-2 text-center text-xs text-teal-500">{passwordSuccess}</p>}
          <Button
            variant="light"
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword}
            className="mt-2"
          >
            {isChangingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </Button>
        </div>

        <div className="w-full border-t border-white/20 pt-4">
          {isConfirmingDelete ? (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs text-accent-coral">
                Hesabın kalıcı olarak silinecek. Onaylamak için şifreni gir.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Şifren"
                autoComplete="current-password"
                className="w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none"
              />
              {deleteError && <p className="text-center text-xs text-accent-coral">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !deletePassword}
                  className="flex-1 rounded-full bg-accent-coral px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isDeleting ? "Siliniyor..." : "Evet, hesabımı sil"}
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 rounded-full bg-white/10 px-4 py-2 text-xs text-white"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="w-full text-center text-xs text-white/50 hover:text-accent-coral"
            >
              Hesabımı sil
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
