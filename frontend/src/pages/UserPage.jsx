import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotebookPen, X } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import UserListModal from "../components/UI/UserListModal";
import Button from "../components/UI/Button";
import StatPill from "../components/UI/StatPill";
import ArticleGrid from "../components/UI/ArticleGrid";
import ArticleCardSkeleton from "../components/UI/ArticleCardSkeleton";
import EmptyState from "../components/UI/EmptyState";

export default function UserPage() {
  const { t } = useTranslation("profile");
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [favoriteTags, setFavoriteTags] = useState(user?.favoriteTags || []);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [tagError, setTagError] = useState("");

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
    const removedTag = favoriteTags.find((t) => t._id === tagId);
    setFavoriteTags((prev) => prev.filter((t) => t._id !== tagId));
    try {
      await toggleFavoriteTag(tagId);
    } catch {
      // İstek başarısız olursa etiketi geri koy — aksi halde kullanıcı
      // arayüzde silinmiş görürken backend'de hâlâ favori kalmaya devam
      // ediyordu, sonraki bir profil yenilemesinde etiket sessizce geri
      // dönüp kafa karıştırıyordu.
      if (removedTag) {
        setFavoriteTags((prev) => [...prev, removedTag]);
      }
      setTagError(t("tagRemoveFailed"));
      setTimeout(() => setTagError(""), 3000);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProfilePanel
        user={user}
        t={t}
        onOpenEdit={() => setIsEditOpen(true)}
        onOpenFollowers={() => setIsFollowersOpen(true)}
        onOpenFollowing={() => setIsFollowingOpen(true)}
      />

      <div className="flex-1">
        {tagError && <p className="mb-2 text-xs text-accent-coral">{tagError}</p>}
        <div className="mb-4 flex flex-wrap gap-2">
          {favoriteTags.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t("noInterests.text")}{" "}
              <Link to="/select-interests" className="font-semibold text-brand-700 hover:underline">
                {t("noInterests.link")}
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
                  aria-label={t("removeTagAria", { tag: tag.name })}
                  className="rounded-full hover:bg-white/20"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>

        {isLoadingArticles ? (
          <ArticleGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </ArticleGrid>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title={t("emptyArticles.title")}
            action={{ label: t("emptyArticles.action"), to: "/write" }}
          />
        ) : (
          <ArticleGrid>
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </ArticleGrid>
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
        <UserListModal
          title={t("followersModal.title")}
          users={user.followers || []}
          emptyMessage={t("followersModal.empty")}
          onClose={() => setIsFollowersOpen(false)}
        />
      )}

      {isFollowingOpen && (
        <UserListModal
          title={t("followingModal.title")}
          users={user.following || []}
          emptyMessage={t("followingModal.empty")}
          onClose={() => setIsFollowingOpen(false)}
        />
      )}
    </div>
  );
}

// Takip sayısı arttıkça (bkz. kullanıcı geri bildirimi) avatar ızgarası sınırsız
// büyüyüp profil kartını kalabalıklaştırıyordu — önizleme sabit sayıda avatarla
// sınırlandı, fazlası "+N" hücresine tıklanınca aynı Takipçiler modalının
// "Takip Edilenler" versiyonunda açılıyor.
const FOLLOWING_PREVIEW_LIMIT = 5;

function ProfilePanel({ user, t, onOpenEdit, onOpenFollowers, onOpenFollowing }) {
  const following = user.following || [];
  const visibleFollowing = following.slice(0, FOLLOWING_PREVIEW_LIMIT);
  const remainingFollowing = following.length - visibleFollowing.length;

  return (
    <div className="flex w-full flex-none flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center lg:w-72">
      <div className="h-20 w-20 overflow-hidden rounded-full bg-brand-400">
        {user.avatar && <img src={user.avatar} alt="" className="h-full w-full object-cover" />}
      </div>

      <p className="rounded-full bg-gray-100 px-4 py-1 text-sm font-semibold text-brand-900">
        {user.username}
      </p>

      <p className="rounded-2xl bg-gray-100 px-4 py-2 text-xs text-brand-800">
        {user.bio || t("bioEmpty")}
      </p>

      <div className="flex gap-2">
        <StatPill label={t("stats.followers")} value={user.followers?.length ?? 0} onClick={onOpenFollowers} />
        <StatPill label={t("stats.favorites")} value={user.favoritesCount ?? 0} />
        <StatPill label={t("stats.articles")} value={user.articlesCount ?? 0} />
      </div>

      <p className="mt-2 text-xs font-semibold text-brand-700">{t("followingHeading")}</p>
      {following.length === 0 ? (
        <p className="text-xs text-gray-400">{t("followingModal.empty")}</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {visibleFollowing.map((author) => (
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
          {remainingFollowing > 0 && (
            <button
              type="button"
              onClick={onOpenFollowing}
              aria-label={t("showMoreAria", { count: remainingFollowing })}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-brand-700 hover:bg-gray-200"
            >
              +{remainingFollowing}
            </button>
          )}
        </div>
      )}

      <Button variant="gold" onClick={onOpenEdit} className="mt-2">
        {t("editProfileButton")}
      </Button>
    </div>
  );
}

function EditProfileModal({ user, onClose, onSaved, onAccountDeleted }) {
  const { t } = useTranslation("profile");
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
      setError(err.response?.data?.message || t("editModal.saveError"));
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
      setPasswordSuccess(t("editModal.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || t("editModal.passwordChangeFailed"));
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
      setDeleteError(err.response?.data?.message || t("editModal.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal title={t("editModal.title")} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        <p className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
          {t("editModal.usernameLabel")} <span className="font-semibold text-white">{user.username}</span>
        </p>

        <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white/20">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-white/70">{t("editModal.avatarPlaceholder")}</span>
          )}
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={t("editModal.bioPlaceholder")}
          className="w-full rounded-xl bg-white/10 p-3 text-sm text-white placeholder-white/50 outline-none"
        />
        <p className="w-full px-2 text-right text-[10px] text-white/50">{bio.length}/300</p>

        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-white/80">{t("editModal.libraryVisibility")}</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleVisibilityChange("private")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                visibility === "private" ? "bg-accent-gold text-brand-900" : "bg-white/10 text-white"
              }`}
            >
              {t("editModal.private")}
            </button>
            <button
              onClick={() => handleVisibilityChange("public")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                visibility === "public" ? "bg-accent-gold text-brand-900" : "bg-white/10 text-white"
              }`}
            >
              {t("editModal.public")}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-sm text-accent-coral">{error}</p>}

        <Button variant="gold" onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("editModal.saving") : t("editModal.save")}
        </Button>

        <div className="w-full border-t border-white/20 pt-4">
          <p className="mb-2 text-xs font-semibold text-white/80">{t("editModal.changePasswordTitle")}</p>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("editModal.currentPasswordPlaceholder")}
            autoComplete="current-password"
            className="mb-2 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("editModal.newPasswordPlaceholder")}
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
            {isChangingPassword ? t("editModal.changingPassword") : t("editModal.changePassword")}
          </Button>
        </div>

        <div className="w-full border-t border-white/20 pt-4">
          {isConfirmingDelete ? (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs text-accent-coral">
                {t("editModal.deleteWarning")}
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t("editModal.deletePasswordPlaceholder")}
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
                  {isDeleting ? t("editModal.deleting") : t("editModal.deleteConfirmYes")}
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 rounded-full bg-white/10 px-4 py-2 text-xs text-white"
                >
                  {t("editModal.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="w-full text-center text-xs text-white/50 hover:text-accent-coral"
            >
              {t("editModal.deleteAccount")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
