import { createContext, useContext, useState } from "react";

const WriteHeaderContext = createContext(null);

// WriteArticle.jsx'in Önizle/Yayınla/otomatik-kaydetme durumunu, Layout.jsx
// tarafından AYRI bir ağaçta (<Outlet/>'in yanında) render edilen
// WriteNavHeader.jsx'e taşır — ikisi kardeş bileşen olduğu için prop ile
// aktarılamıyor. WriteArticle mount olduğunda setActions({...}) ile doldurur,
// unmount'ta null'a döner (kullanıcı /write'tan ayrılınca Navbar eski hâline
// dönsün diye).
export function WriteHeaderProvider({ children }) {
  const [actions, setActions] = useState(null);

  return (
    <WriteHeaderContext.Provider value={{ actions, setActions }}>{children}</WriteHeaderContext.Provider>
  );
}

export const useWriteHeader = () =>
  useContext(WriteHeaderContext) || { actions: null, setActions: () => {} };
