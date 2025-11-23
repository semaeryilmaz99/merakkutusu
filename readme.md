MERAKKUTUSU fullstack web app:

Kullanıcıların birbirleriyle ilginç buldukları veya merak ettikleri konuları makaleler halinde paylaşabildikleri, 

bu konulara özel olarak birbirleriyle/topluluk halinde ilgili chat roomlarda mesajlaşabildikleri, (Bir makaleyi kitaplığına ekleyen kullanıcılar bu makalenin sayfasındaki chat roomda konu hakkında konuşabilirler. Dashboard chatte ise genel grup sohbeti yapılır. Yazarların kendi sayfasında chat olacak, burada da direkt bireysel olarak yazarla konuşulacak.)

makaleleri kütüphanelerine ekleyebildikleri, kütüphanelerinin görünürlüğünü belirledikleri (public/private),

makalelere yorum yapabildikleri, favorilere ekleyebildikleri,

birbirlerini takip edebildikleri,

kendi makalelerini silme/editleme işlemleri yapabildikleri (CRUD), 

Notifications: yeni takipçi, yorum, favori bildirimi aldıkları, 

File Upload: makalelere görsel ekleme yapabildikleri (Multer + Cloudinary), 

Search & Filter: makale arama/filtreleme, kullanıcı arama yapabildikleri,

Birbirlerini takip edebildikleri,

Ve her kullanıcıya özel olarak takip ettikleri kullanıcıların paylaşımları ile feed oluşturulan bir sosyal paylaşım platformudur. (keşfet bölümünde kategoriler halinde, kullanıcıların girmiş olduğu bütün makaleler gösterilir. kategorideki makaleler ayrı bir sayfada açılır)

Bu platforma mail adresleri ile kayıt olunur, mail adresine üyelik doğrulama maili gönderilir ve onay linkine tıklanınca kullanıcıya özel olarak oluşturulan jwt ile login olunur. 

Loginde ayrıca şifre unutma işlemleri gerçekleştirilebilir. 

Admin ve user ayrımı ile authorization ayarlaması yapılır. admin ve user role için protected route ve erişim yetkileri atanır.

Veritabanı mongoDB'de saklanır ve veritabanı schemaları mongoose ile oluşturulur.

Bu web uygulamasını fullstack olarak yazacağım. Kullanacağım teknolojiler: 

1) Backend için: node.js-express.js-nodemon-axios-bcryptjs-jsonwebtoken-nodemailer-socket.io(mesajlaşma için), 
2) Frontend için: react-javascript-tailwindcss-sass(vanilla css için css preprocessor), 
3) Veritabanı için: mongodb compose ve mongoose   

Eklenecek diğer özellikler: 
1) kullanıcının ilgi alanlarına göre makale filtrelemesi, buna göre feed oluşturulması (figma ui ekledim, backend kaldı.) (kullanıcı kendi profilinde ilgi duyduğu tag'leri seçer, makaleler bu taglere göre filtrelenerek her kullanıcıya özel getirilir.) 
2) keşfette tüm makalelerin bütün taglere göre kategoriler halinde gösterilmesi (figma ui ekledim, backend kaldı.)
3) Gerçek zamanlı chat / mesajlaşma
Socket.IO ile makaleye özel veya kullanıcılar arası chat odaları.
4) Bildirim sistemi frontend entegrasyonu
Kullanıcıya yeni yorum / takipçi / favori geldiğinde push notification.
5) Profil sayfası geliştirmeleri
Kullanıcı biyografisi, avatar, takipçi sayısı, library görünümü.
6) Admin paneli
Makale veya kullanıcı silme / düzenleme yetkisi
Kullanıcıların aktivitelerini izleme
7) Advanced Feed
Popüler makaleler, trending tags
Kişiselleştirilmiş öneriler
8) Performans ve güvenlik
Rate limiting, input validation
Image / file optimizasyonu
JWT refresh token mekanizması
9) Feed sıralamasını popülerlik veya tarih gibi kriterlere göre iyileştirebiliriz.

Backendi tamamlanan özellikler: 

1) Kullanıcı yönetimi

Kayıt / doğrulama maili

Login / JWT ile authentication

Logout ve token blacklist sistemi

Şifre unutma / reset

Logout

2) Makale (Article)

CRUD (Create, Read, Update, Delete)

Favorilere ekleme / çıkarma

Yorum ekleme

Tag bazlı filtreleme / ayrıca kullanıcı makale oluştururken yeni tag oluşturabilir.

Library’ye ekleme / çıkarma

Feed (takip edilen kullanıcıların ve signup olurken seçilen favori subjectlerin makaleleri)

3) Kullanıcılar

Takip etme / takipten çıkarma

Arama (username / bio)

Kendi kütüphanesini görme

Kütüphane gizlilik ayarı (public / private)

4) Bildirimler

Yeni takipçi

Yeni yorum

Favori bildirimi

5) Dosya / resim yükleme

Multer + Cloudinary ile makaleye görsel ekleme

6) Filtreleme & Arama

Makale arama (title / content / tags)

Kullanıcı arama

Tag filtreleme / tag'leri favorilere ekleme-çıkarma

7) Popüler makaleler (en çok beğeni ve yorum alanlar puana göre sıralanır), kişiselleştirilmiş feed (takip edilen kullanıcı ve favorilenen taglere göre), trending-tags ve toggle favorite tags özellikleri eklendi.