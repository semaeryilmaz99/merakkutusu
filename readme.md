MERAKKUTUSU fullstack web app:

Kullanıcıların birbirleriyle ilginç buldukları veya merak ettikleri konuları makaleler veya daha kısa metinler halinde paylaşabildikleri, 

bu konulara özel olarak birbirleriyle ilgili chat roomlarda mesajlaşabildikleri, 

makaleleri favori listelerine ekleyebildikleri, 

makalelere veya yazılara yorum yapabildikleri, 

kendi makalelerini silme/editleme işlemleri yapabildikleri (CRUD), 

Notifications: yeni takipçi, yorum, favori bildirimi aldıkları, 

File Upload: makalelere görsel ekleme yapabildikleri (Multer + Cloudinary), 

Search & Filter: makale arama, kullanıcı arama yapabildikleri,

Birbirlerini takip edebildikleri,

Ve her kullanıcıya özel olarak takip ettikleri kullanıcıların paylaşımları ile feed oluşturulan bir sosyal paylaşım platformudur. 

Bu platforma mail adresleri ile kayıt olunur, mail adresine üyelik doğrulama maili gönderilir ve onay linkine tıklanınca kullanıcıya özel olarak oluşturulan jwt ile login olunur. 

Loginde ayrıca şifre unutma işlemleri gerçekleştirilebilir. 

Admin ve user ayrımı ile authorization ayarlaması yapılır. admin ve user role için protected route ve erişim yetkileri atanır.

Veritabanı mongoDB'de saklanır ve veritabanı schemaları mongoose ile oluşturulur.

Bu web uygulamasını fullstack olarak yazacağım. Kullanacağım teknolojiler: 

1) Backend için: node.js-express.js-nodemon-axios-bcryptjs-jsonwebtoken-nodemailer-socket.io(mesajlaşma için), 
2) Frontend için: react-javascript-tailwindcss-sass(vanilla css için css preprocessor), 
3) Veritabanı için: mongodb compose ve mongoose   

Eklenebilecek diğer özellikler: 
1) kullanıcının ilgi alanlarına göre makale filtrelemesi, buna göre feed oluşturulması