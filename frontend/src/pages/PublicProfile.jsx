import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Library, NotebookPen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getArticlesByAuthor } from "../services/articleService";
import { getPublicProfile, followUser, getUserLibrary } from "../services/userService";
import ArticleCard from "../components/ArticleCard";
import Button from "../components/UI/Button";
import StatPill from "../components/UI/StatPill";
import ArticleGrid from "../components/UI/ArticleGrid";
import EmptyState from "../components/UI/EmptyState";

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [library, setLibrary] = useState(null);
  const [libraryError, setLibraryError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [followError, setFollowError] = useState("");

  useEffect(() => {
    // Kullanıcı hızlıca A profilinden B profiline geçerse, A için atılmış
    // istek B'ninkinden GEÇ dönebilir — "ignore" bayrağı olmadan A'nın
    // cevabı state'e yazılıp ekranda B'nin URL'sinde A'nın verisi
    // görünebilirdi. Cleanup'ta bayrak set edilip geç gelen cevap yok sayılıyor.
    let ignore = false;

    setIsLoading(true);
    Promise.all([getPublicProfile(id), getArticlesByAuthor(id)])
      .then(([profileData, articlesData]) => {
        if (ignore) return;
        setProfile(profileData);
        setArticles(articlesData);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    getUserLibrary(id)
      .then((data) => {
        if (!ignore) setLibrary(data);
      })
      .catch(() => {
        if (!ignore) setLibraryError("Bu kullanıcının kütüphanesi gizli.");
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleToggleFollow = async () => {
    const wasFollowing = profile.isFollowing;
    setProfile((prev) => ({
      ...prev,
      isFollowing: !wasFollowing,
      followersCount: prev.followersCount + (wasFollowing ? -1 : 1),
    }));
    try {
      await followUser(id);
    } catch {
      setProfile((prev) => ({
        ...prev,
        isFollowing: wasFollowing,
        followersCount: prev.followersCount + (wasFollowing ? 1 : -1),
      }));
      setFollowError("İşlem başarısız, tekrar dene.");
      setTimeout(() => setFollowError(""), 3000);
    }
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
          <>
            <Button
              variant={profile.isFollowing ? "light" : "gold"}
              onClick={handleToggleFollow}
              className="mt-2"
            >
              {profile.isFollowing ? "Takibi Bırak" : "Takip Et"}
            </Button>
            {followError && <p className="text-xs text-accent-coral">{followError}</p>}
          </>
        )}
      </div>

      <div className="flex-1">
        <h2 className="mb-3 text-sm font-semibold text-brand-900">Makaleleri</h2>
        {articles.length === 0 ? (
          <div className="mb-6">
            <EmptyState icon={NotebookPen} title="Henüz makale yazmamış." />
          </div>
        ) : (
          <ArticleGrid className="mb-6">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </ArticleGrid>
        )}

        <h2 className="mb-3 text-sm font-semibold text-brand-900">Kütüphanesi</h2>
        {libraryError ? (
          <p className="text-sm text-gray-500">{libraryError}</p>
        ) : !library || library.length === 0 ? (
          <EmptyState icon={Library} title="Kütüphane boş." />
        ) : (
          <ArticleGrid>
            {library.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </ArticleGrid>
        )}
      </div>
    </div>
  );
}
