import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getArticlesByAuthor } from "../services/articleService";
import { updateProfile, updateLibraryVisibility, toggleFavoriteTag } from "../services/userService";
import ArticleCard from "../components/ArticleCard";
import Modal from "../components/UI/Modal";
import Button from "../components/UI/Button";

export default function UserPage() {
  const { user, refreshUser } = useAuth();

  const [articles, setArticles] = useState([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [favoriteTags, setFavoriteTags] = useState(user?.favoriteTags || []);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
        />
      )}
    </div>
  );
}

function ProfilePanel({ user, onOpenEdit }) {
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
        <StatPill label="takipçi" value={user.followers?.length ?? 0} />
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
                <img src={author.avatar} alt="" className="h-full w-full object-cover" />
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

function StatPill({ label, value }) {
  return (
    <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-full bg-brand-700 text-white">
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

function EditProfileModal({ user, onClose, onSaved }) {
  const [bio, setBio] = useState(user.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [visibility, setVisibility] = useState(user.libraryVisibility || "private");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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
      </div>
    </Modal>
  );
}
