import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getArticlesByAuthor } from "../services/articleService";
import { getPublicProfile, followUser, getUserLibrary } from "../services/userService";
import ArticleCard from "../components/ArticleCard";
import Button from "../components/UI/Button";

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [library, setLibrary] = useState(null);
  const [libraryError, setLibraryError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getPublicProfile(id), getArticlesByAuthor(id)])
      .then(([profileData, articlesData]) => {
        setProfile(profileData);
        setArticles(articlesData);
      })
      .finally(() => setIsLoading(false));

    getUserLibrary(id)
      .then(setLibrary)
      .catch(() => setLibraryError("Bu kullanıcının kütüphanesi gizli."));
  }, [id]);

  const handleToggleFollow = async () => {
    setProfile((prev) => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      followersCount: prev.followersCount + (prev.isFollowing ? -1 : 1),
    }));
    await followUser(id);
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-accent-coral">Kullanıcı bulunamadı.</p>;
  }

  const isOwnProfile = currentUser?._id === profile._id;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-none flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center lg:w-72">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-brand-400">
          {profile.avatar && <img src={profile.avatar} alt="" className="h-full w-full object-cover" />}
        </div>

        <p className="rounded-full bg-gray-100 px-4 py-1 text-sm font-semibold text-brand-900">
          {profile.username}
        </p>

        <p className="rounded-2xl bg-gray-100 px-4 py-2 text-xs text-brand-800">
          {profile.bio || "Henüz biyografi eklenmedi."}
        </p>

        <div className="flex gap-2">
          <StatPill label="takipçi" value={profile.followersCount} />
          <StatPill label="favori" value={profile.favoritesCount} />
          <StatPill label="makale" value={profile.articlesCount} />
        </div>

        {!isOwnProfile && (
          <Button
            variant={profile.isFollowing ? "light" : "gold"}
            onClick={handleToggleFollow}
            className="mt-2"
          >
            {profile.isFollowing ? "Takibi Bırak" : "Takip Et"}
          </Button>
        )}
      </div>

      <div className="flex-1">
        <h2 className="mb-3 text-sm font-semibold text-brand-900">Makaleleri</h2>
        {articles.length === 0 ? (
          <p className="mb-6 text-sm text-gray-500">Henüz makale yazmamış.</p>
        ) : (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}

        <h2 className="mb-3 text-sm font-semibold text-brand-900">Kütüphanesi</h2>
        {libraryError ? (
          <p className="text-sm text-gray-500">{libraryError}</p>
        ) : !library || library.length === 0 ? (
          <p className="text-sm text-gray-500">Kütüphane boş.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {library.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}
      </div>
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
