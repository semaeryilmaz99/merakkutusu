// Kullanıcıdan gelen serbest metni $regex filtresine vermeden önce kaçışlıyor.
// Kaçışlanmamış özel karakterler (ör. tek bir "[" ) MongoDB'nin regex derlemesini
// çökertip yakalanmamış bir hataya (500) yol açabiliyordu — arama kutusuna
// tesadüfen özel bir karakter yazan herhangi bir kullanıcı bunu tetikleyebilirdi.
export default function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
