# 90+9 — Ayrıntılı Ürün ve Geliştirme Yol Haritası

> Son güncelleme: 7 Ağustos 2026
> Kullanıcıya görünen ürün adı: **90+9**
> Teknik proje, depo ve klasör adı: `90plus9`
> MVP veri kapsamı: 2012/13–2025/26
> Ana veri kaynağı: `dcaribou/transfermarkt-datasets`
> Oyun biçimi: 3×3 günlük futbol grid oyunu

## 1. Bu belge nasıl kullanılmalı?

Bu dosya hem ürün yol haritası hem de uygulanabilir görev listesi olarak tasarlanmıştır.

- `[ ]` tamamlanmamış görevi gösterir.
- `[x]` tamamlanmış görevi gösterir.
- Her faz, kendisinden önceki fazın kabul kriterleri sağlandıktan sonra kapatılmalıdır.
- Bir görev uygulanmayacaksa silinmemeli; `İptal — gerekçe` notuyla işaretlenmelidir.
- Bir karar değiştiğinde yalnızca kod değil, bu belge de güncellenmelidir.
- “MVP dışı” olarak işaretlenen işlere MVP tamamlanmadan başlanmamalıdır.
- Veri hataları kodla gizlenmemeli; `data_quality_issues` tablosunda izlenmelidir.
- Üretimde kullanılan her veri satırının kaynağı veya türetme yöntemi açıklanabilir olmalıdır.

## 2. Kesinleşmiş ürün kararları

Bu bölümdeki kararlar yol haritasının varsayımlarıdır. Değiştirileceklerse önce ürün kararı olarak değiştirilmelidir.

- [x] Kullanıcıya görünen marka adı `90+9` olacak.
- [x] Teknik proje, klasör, paket ve slug adı için `90plus9` kullanılacak.
- [x] `+` karakteri yalnızca kullanıcıya görünen marka adında kullanılacak.
- [x] Oyun Türkiye erkekler Süper Lig odaklı olacak.
- [x] MVP, 2012/13 sezonundan başlayacak.
- [x] MVP, 2025/26 sezonunu içerecek.
- [x] dcaribou verisindeki `season = 2012`, uygulamada `2012/13` olarak gösterilecek.
- [x] dcaribou verisindeki `season = 2025`, uygulamada `2025/26` olarak gösterilecek.
- [x] Ana veri kaynağı dcaribou olacak.
- [x] Ücretli veri API’si kullanılmayacak.
- [x] Oyuncu yüzleri MVP kapsamına alınmayacak.
- [x] Kulüp logoları MVP kapsamına alınmayacak.
- [x] Gol, asist, dakika ve kart kriterleri MVP kapsamına alınmayacak.
- [x] Oyuncu–kulüp–sezon ilişkisi `appearances` ve `game_lineups` birleşiminden üretilecek.
- [x] Oyuncunun sahaya çıkması ilişki için güçlü kanıt sayılacak.
- [x] Oyuncunun resmî maçta ilk 11 veya yedek listesinde olması ilişki için yeterli sayılacak.
- [x] Transfer kaydı tek başına “bu takımda oynadı/kadrosunda bulundu” kanıtı sayılmayacak.
- [x] 2012/13 sezonunda kadro listesi olmadığı için yalnızca sahaya çıkan oyuncular kapsanacak.
- [x] Hükmen sonuçlanan ve oynanmayan maçlardan oyuncu ilişkisi üretilmeyecek.
- [x] Genel mevki dört gruptan oluşacak: kaleci, defans, orta saha, forvet.
- [x] Ayrıntılı mevki kaynak veri olarak saklanacak ancak ilk sürümde ana kriter olmayacak.
- [x] Takım arkadaşlığı temel olarak aynı kulüp ve aynı sezon üzerinden tanımlanacak.
- [x] Aynı maçta birlikte oynama zorunluluğu olmayacak.
- [x] Şampiyonluk bilgisi doğrulanmış yardımcı bir tablodan alınacak.
- [x] “Şampiyon oldu” yerine gerekirse “şampiyon takım kadrosunda yer aldı” ifadesi kullanılacak.
- [x] İstanbul takımı kuralı olacak.
- [x] İstanbul dışı/Anadolu takımı kuralı olacak.
- [x] Dört Büyükler kuralı olacak.
- [x] Dört Büyükler: Beşiktaş, Fenerbahçe, Galatasaray ve Trabzonspor olacak.
- [x] Ham dcaribou paketi tarayıcıya gönderilmeyecek.
- [x] Uygulama verileri PostgreSQL’de saklanacak.
- [x] Hücre cevapları backend tarafından doğrulanacak.
- [x] Geçerli cevapların tamamı frontend’e gönderilmeyecek.
- [x] Yanlış tahmin hakkı sınırsız olacak.
- [x] Yanlış tahmin hücreyi kilitlemeyecek veya oyunu bitirmeyecek.
- [x] Oyun yalnızca dokuz hücre doğru doldurulduğunda tamamlanacak; kaybetme durumu olmayacak.
- [x] Kullanıcı hesabı MVP’de zorunlu olmayacak; oyun durumu anonim sunucu oturumunda tutulacak.
- [x] MVP’de temel ilerleme ölçüsü doğru doldurulan hücre sayısı olacak; rarity beta sonrasına bırakılacak.

## 3. MVP’nin başarı tanımı

MVP aşağıdaki şartların tümü sağlandığında tamamlanmış sayılacak:

- [ ] Kullanıcı günün 3×3 gridini açabiliyor.
- [ ] Gridde üç satır ve üç sütun kriteri doğru biçimde gösteriliyor.
- [ ] Her hücre en az bir değil, belirlenen güvenli alt sınır kadar geçerli cevaba sahip.
- [ ] Kullanıcı oyuncu adına göre arama yapabiliyor.
- [ ] Kullanıcı arama sonucundan tek bir oyuncu seçebiliyor.
- [ ] Seçilen oyuncu backend’de hücreye karşı doğrulanıyor.
- [ ] Doğru cevap hücreyi kilitliyor.
- [ ] Yanlış cevap hak tüketmeden hücreyi açık ve oyun oturumunu aktif bırakıyor.
- [ ] Kullanıcı boş hücrede sınırsız tahmin yapabiliyor; dolu hücreye tekrar cevap veremiyor.
- [ ] Oyun tamamlanınca sonuç ekranı gösteriliyor.
- [ ] Aynı takvim gününde bütün kullanıcılar aynı gridi görüyor.
- [ ] Gün değişince yeni grid aktif oluyor.
- [ ] Hiçbir grid hücresinin geçerli cevap sayısı sıfır değil.
- [ ] Hiçbir grid satırı veya sütunu tamamen aşırı zor hücrelerden oluşmuyor.
- [ ] Veritabanında kullanılan dcaribou sürümü görüntülenebiliyor.
- [ ] Veri kaynağı ve lisans bilgisi sitede açıklanıyor.
- [ ] Yönetici, sorunlu oyuncu veya ilişki kaydını pasife alabiliyor.
- [ ] Yönetici bir gridi yayından önce önizleyebiliyor.
- [ ] Üretim veritabanının yedeği alınabiliyor ve geri yükleme yöntemi belgelenmiş durumda.
- [ ] Temel mobil, masaüstü, erişilebilirlik, güvenlik ve performans testleri geçiyor.

## 4. Önerilen teknik temel

Bu yol haritası aşağıdaki varsayılan mimariye göre yazılmıştır. Eşdeğer teknolojiler seçilebilir; ancak görevlerin amacı korunmalıdır.

- Web uygulaması: Next.js + TypeScript
- Backend: Next.js sunucu endpoint’leri veya aynı işlevleri sağlayan Node.js servisi
- Veritabanı: PostgreSQL
- ORM/migration: Prisma veya eşdeğer migration aracı
- Test: unit + integration + Playwright benzeri uçtan uca test aracı
- CI: GitHub Actions veya eşdeğer CI sistemi
- Ham veri işleme: Python veya TypeScript tabanlı ETL komutları
- Barındırma: yönetilen web servisi + yönetilen PostgreSQL
- Dosya/snapshot saklama: özel object storage veya CI artifact alanı
- MVP cache: zorunlu değil
- MVP Redis/queue: zorunlu değil

## 5. Üst seviye kilometre taşları

### M0 — Ürün tanımı kilitlendi

- Kriter tanımları yazılı.
- Sınırsız yanlış tahmin ve puanlama kararı verilmiş.
- MVP dışı özellikler ayrılmış.

### M1 — Güvenilir veri tabanı hazır

- dcaribou verisi indiriliyor.
- Süper Lig verisi ayıklanıyor.
- Oyuncu–kulüp–sezon ilişkileri oluşturuluyor.
- Yardımcı kulüp ve şampiyonluk verileri ekleniyor.
- Veri kalite kontrolleri geçiyor.

### M2 — Kural motoru ve grid üretici hazır

- Bütün MVP kriterleri aynı arayüzden sorgulanıyor.
- Kesişim cevapları doğru hesaplanıyor.
- İmkânsız ve aşırı zor gridler eleniyor.

### M3 — Yerelde oynanabilir MVP hazır

- Günlük grid açılıyor.
- Oyuncu aranıyor.
- Tahmin doğrulanıyor.
- Oyun tamamlanıyor.

### M4 — Yönetim ve kalite araçları hazır

- Grid önizleme ve yayınlama çalışıyor.
- Hatalı veri işaretlenebiliyor.
- Manuel düzeltmeler kayda geçiyor.

### M5 — Üretime hazır sürüm

- Güvenlik, performans, yedek ve gözlemleme tamam.
- Staging testi geçildi.
- Yayın kontrol listesi tamamlandı.

### M6 — Açık beta

- Gerçek oyuncular oyunu kullanıyor.
- Zorluk ve cevap davranışı ölçülüyor.
- Veri hataları geri bildirimle düzeltiliyor.

---

# FAZ 0 — Ürün kurallarını kesinleştirme

## 0.1. Tek cümlelik ürün tanımı

- [x] Ürün adını `90+9` olarak sabitle.
- [x] Teknik adını `90plus9` olarak sabitle.
- [x] Ürünün tek cümlelik açıklamasını yaz.
- [x] Tek cümlelik açıklamada `90+9` marka adını kullan.
- [x] Açıklamada “Türkiye Süper Lig” ifadesini geçir.
- [x] Açıklamada “3×3 günlük grid” ifadesini geçir.
- [x] Açıklamada kullanıcının oyuncu tahmin ettiğini belirt.
- [x] Açıklamayı ana sayfa, README ve mağaza/SEO metninde kullanılabilecek kadar kısa tut.

> Onaylanan açıklama: **90+9, Türkiye Süper Lig oyuncularını tahmin ederek her gün tamamladığın 3×3 günlük grid oyunudur.**

## 0.2. Kapsam dışı listesini kilitleme

- [x] Oyuncu fotoğraflarını MVP dışı olarak işaretle.
- [x] Kulüp logolarını MVP dışı olarak işaretle.
- [x] Gol kriterlerini MVP dışı olarak işaretle.
- [x] Asist kriterlerini MVP dışı olarak işaretle.
- [x] Kart kriterlerini MVP dışı olarak işaretle.
- [x] Piyasa değeri kriterlerini MVP dışı olarak işaretle.
- [x] Forma numarası kriterlerini MVP dışı olarak işaretle.
- [x] Kaptanlık kriterlerini MVP dışı olarak işaretle.
- [x] Millî takım maç sayısı kriterlerini MVP dışı olarak işaretle.
- [x] Türkiye Kupası ve Avrupa kupalarını MVP dışı olarak işaretle.
- [x] 2000/01–2011/12 sezonlarını MVP dışı/backlog olarak işaretle.
- [x] Mobil uygulamayı MVP dışı olarak işaretle; responsive web’i kapsamda tut.
- [x] Gerçek zamanlı çok oyunculu modu MVP dışı olarak işaretle.

## 0.3. Oyun hakları kararı

- [x] Hücre başına yanlış tahmin hakkını sınırsız olarak belirle.
- [x] Yanlış tahminin hücreyi kilitlemeyeceğini belirle.
- [x] Toplam tahmin hakkı veya kaybetme durumu olmayacağını belirle.
- [x] Oyunun boş hücrelerle tamamlanamayacağını belirle.
- [x] Oyunun zaman sınırlı olmayacağını belirle.
- [x] Sayfa yenilemenin doldurulmuş hücreleri veya oyun durumunu sıfırlamayacağını gereksinim olarak yaz.
- [x] Misafir kullanıcının oyun durumunun anonim sunucu oturumunda korunacağını belirle.
- [x] Kullanıcı hesabı açmanın MVP’de zorunlu olmadığını belirle.
- [x] Oyun durumu için tahmin edilemeyen kimliğe sahip anonim sunucu oturumu kullanılacağını kaydet.
- [x] Sınırsız tahmin hakkından bağımsız olarak otomasyon ve veri kazımasına karşı teknik oran sınırlaması uygulanacağını kaydet.

## 0.4. Doğru cevap tanımı

- [x] Oyuncu–kulüp ilişkisi için kabul edilen kanıtları yaz.
- [x] `appearance` kanıtını tanımla.
- [x] `starting_lineup` kanıtını tanımla.
- [x] `substitutes` kanıtını tanımla.
- [x] `transfer_only` kaydının kabul edilmeyeceğini yaz.
- [x] Hükmen maçın oyuncu ilişkisi oluşturmayacağını yaz.
- [x] 2012/13’te yalnızca sahaya çıkanların kapsandığını kullanıcı yardım metnine ekle.
- [x] Aynı oyuncunun bir sezonda iki Süper Lig kulübü için kabul edilebileceğini yaz.
- [x] Devre arası transferinde iki kulüp ilişkisinin de kanıt varsa geçerli olacağını yaz.

## 0.5. Takım arkadaşlığı tanımı

- [x] MVP tanımını yaz: aynı `club_id` ve aynı `season`.
- [x] Aynı maçta bulunma zorunluluğu olmadığını yaz.
- [x] Sezon içinde zaman aralıklarının gerçekten örtüşmesinin aranmayacağını yaz.
- [x] Devre arası birbirini kaçıran iki oyuncunun aynı kulüp–sezon nedeniyle eşleşebileceğini bilinen sınırlama olarak yaz.
- [x] Kullanıcı arayüzündeki açıklamayı “aynı sezonda aynı kulüp kadro verisinde yer aldı” biçiminde hazırla.
- [x] Daha sıkı zaman örtüşmesi seçeneğini MVP sonrası backlog’a ekle.

## 0.6. Şampiyonluk tanımı

- [x] `champion_squad_member` alanını tanımla.
- [x] `champion_with_appearance` alanını tanımla.
- [x] MVP kuralında `champion_squad_member` kullanılacağını kararlaştır.
- [x] Maç kadrosunda yer almanın yeterli olduğunu kaydet.
- [x] Görünen kriter metnini “Şampiyon takım kadrosunda yer aldı” olarak belirle.
- [x] Devre arasında şampiyon kulüpten ayrılan oyuncunun bu tanıma göre kabul edildiğini yardım metnine ekle.

## 0.7. İstanbul/Anadolu ve Dört Büyük tanımı

- [x] “İstanbul kulübü”nü kulübün merkez şehrinin İstanbul olması şeklinde tanımla.
- [x] “İstanbul dışı kulüp”ü merkez şehrinin İstanbul olmaması şeklinde tanımla.
- [x] “Anadolu takımı” görünen adı kullanılacaksa bunun İstanbul dışı kulüp anlamına geldiğini açıkla.
- [x] Ankara ve İzmir kulüplerinin İstanbul dışı/Anadolu grubuna dahil olduğunu açıkça yaz.
- [ ] Dört Büyük kulüp listesini sabit kulüp kimlikleriyle tanımla; kimlikleri veri içe aktarımında doğrula.
- [ ] Beşiktaş kulüp kimliğini doğrula.
- [ ] Fenerbahçe kulüp kimliğini doğrula.
- [ ] Galatasaray kulüp kimliğini doğrula.
- [ ] Trabzonspor kulüp kimliğini doğrula.
- [x] “Dört Büyükler’den birinde oynadı” kuralını tanımla.
- [x] “Dört Büyükler’den en az ikisinde oynadı” kuralını tanımla.
- [x] “Hem İstanbul hem İstanbul dışı kulüpte oynadı” kuralını tanımla.

## 0.8. Puanlama ve rarity kararı

- [x] MVP’de temel ilerleme ölçüsünü doğru doldurulan hücre sayısı olarak belirle.
- [x] Rarity yüzdesinin beta sonrasında canlı kullanıcıların doğru cevaplarından üretileceğini kararlaştır.
- [x] İlk yayında rarity göstermeyerek veri azlığının yanıltıcı sonuç üretmesini engelle.
- [ ] Çok az cevapta yüzdelerin kullanıcıyı yanıltmaması için minimum örnek sayısı belirle.
- [ ] Aynı kullanıcının aynı cevabı istatistiği şişirmesini engelle.
- [ ] Bot ve tekrar istekleri rarity hesabından çıkar.
- [x] MVP’de doğru hücre sayısını göster, rarity’yi beta sonrasına bırak.

## Faz 0 kabul kriterleri

- [x] Bütün MVP tanımları `docs/PRODUCT_DECISIONS.md` belgesinde bulunuyor.
- [x] Takım arkadaşlığı konusunda yoruma açık ifade kalmadı.
- [x] Şampiyonluk konusunda yoruma açık ifade kalmadı.
- [x] Anadolu/İstanbul dışı tanımı kesin.
- [x] Sınırsız yanlış tahmin davranışı kesin.
- [x] MVP dışı işler ekip tarafından biliniyor.

---

# FAZ 1 — Proje ve geliştirme ortamı kurulumu

## 1.1. Depo oluşturma

- [x] `90plus9` adlı Git deposu oluştur.
- [x] Ana branch adını `main` olarak belirle.
- [ ] Branch koruma kuralı ekle.
- [x] README dosyası oluştur.
- [x] README ana başlığını `90+9` yap.
- [x] Proje amacını README’ye yaz.
- [x] MVP kapsamını README’ye yaz.
- [x] Yerel kurulum komutlarını README’ye yaz.
- [x] Test komutlarını README’ye yaz.
- [x] Veri kaynağı bağlantısını README’ye yaz.
- [x] Lisans/atıf bölümünü README’ye ekle.
- [x] Bu yol haritasını depoya ekle.

## 1.2. Klasör yapısı

- [x] `apps/web` veya eşdeğer frontend klasörünü oluştur.
- [x] `packages/database` veya eşdeğer veritabanı klasörünü oluştur.
- [x] `packages/rules` veya eşdeğer kural motoru klasörünü oluştur.
- [x] `scripts/data` veya eşdeğer ETL klasörünü oluştur.
- [x] `data/raw` klasörünün Git’e alınmamasını sağla.
- [x] `data/staging` klasörünün Git’e alınmamasını sağla.
- [x] Küçük, elle yönetilen referans verileri için `data/reference` klasörü oluştur.
- [x] Veri kalite raporları için `reports/data-quality` klasörü oluştur.
- [x] Mimari karar kayıtları için `docs/adr` klasörü oluştur.
- [x] API belgeleri için `docs/api` klasörü oluştur.

## 1.3. Kod standartları

- [x] TypeScript strict modunu aç.
- [x] Linter yapılandır.
- [x] Formatter yapılandır.
- [x] Import sıralama kuralı belirle.
- [x] Dosya adlandırma standardı belirle.
- [x] Veritabanı tablo adlandırma standardı belirle.
- [x] API hata gövdesi standardı belirle.
- [x] Tarihleri uygulama içinde ISO formatında taşıma standardı belirle.
- [x] Sezonu veritabanında başlangıç yılı olarak saklama standardı belirle.
- [x] Kullanıcıya sezonu `YYYY/YY` biçiminde gösterme yardımcı fonksiyonunu oluştur ve test et.

## 1.4. Ortam değişkenleri

- [x] `.env.example` oluştur.
- [x] `DATABASE_URL` alanını ekle.
- [x] `DATASET_VERSION` alanını ekle.
- [x] `DATASET_DOWNLOAD_URL` alanını ekle.
- [x] `ADMIN_SESSION_SECRET` alanını ekle.
- [x] `GAME_SESSION_SECRET` alanını ekle.
- [x] `CRON_SECRET` alanını ekle.
- [x] Gözlemleme servisi kullanılacaksa DSN alanını ekle.
- [x] Gerçek sırların Git’e girmediğini kontrol et.
- [ ] Yerel, test, staging ve production ortamlarını ayır.

## 1.5. Yerel PostgreSQL

- [x] Yerel PostgreSQL çalıştırma yöntemini seç.
- [x] Geliştirici için tek komutla veritabanı başlatma yolu sağla.
- [x] Uygulama veritabanı oluştur.
- [x] Test veritabanı oluştur.
- [x] Migration kullanıcısını tanımla.
- [x] Uygulama kullanıcısına minimum gerekli yetkileri ver.
- [x] Bağlantı testi yaz.
- [x] Veritabanı sıfırlama komutunu yalnızca yerel/test ortamında çalışacak şekilde koru.

## 1.6. CI temel kurulumu

- [x] Her pull request’te bağımlılık kurulumu çalıştır.
- [x] Her pull request’te lint çalıştır.
- [x] Her pull request’te tip kontrolü çalıştır.
- [x] Her pull request’te unit test çalıştır.
- [x] Test veritabanı gerektiren integration test işini ekle.
- [ ] Başarısız CI varken merge’i engelle.
- [x] Bağımlılık cache’i ekle.
- [ ] CI sırlarını yalnızca gerekli job’lara aç.

## Faz 1 kabul kriterleri

- [x] Yeni bir geliştirici README’yi izleyerek projeyi açabiliyor.
- [x] Tek komutla geliştirme sunucusu çalışıyor.
- [x] Tek komutla testler çalışıyor.
- [x] Tek komutla yerel PostgreSQL hazır oluyor.
- [x] Boş projede CI yeşil.

---

# FAZ 2 — Veri kaynağı, lisans ve snapshot yönetimi

## 2.1. Kaynağı kayıt altına alma

- [x] dcaribou GitHub depo URL’sini kaydet.
- [x] Kaggle/dosya indirme URL’sini kaydet.
- [x] Kaynak paketin CC0 bilgisini kaydet.
- [x] Verinin Transfermarkt kaynaklı olduğunu atıf metninde belirt.
- [x] Oyuncu görsel URL’lerinin kullanılmayacağını not et.
- [x] Kulüp logolarının kullanılmayacağını not et.
- [x] Üretimde kullanılan kaynak sürümünü saklama zorunluluğunu yaz.
- [x] Lisans metninin bir kopyasını proje belgelerine ekle veya kalıcı bağlantı ver.

## 2.2. Snapshot indirme

- [x] Veri indirme komutu oluştur.
- [x] Komutun sürüm numarası kabul etmesini sağla.
- [x] Sürüm verilmezse “latest” kullanılmasının yalnızca yerel incelemede mümkün olmasını sağla.
- [x] Production import için açık sürüm numarasını zorunlu tut.
- [x] İndirilen dosyanın adında sürüm numarası bulunsun.
- [x] İndirilen dosyanın SHA-256 özetini hesapla.
- [x] Dosya boyutunu kaydet.
- [x] İndirme zamanını kaydet.
- [x] İndirme yarıda kesilirse bozuk dosyayı kullanma.
- [x] Aynı sürüm daha önce indirilmişse checksum doğrula.
- [x] Ham snapshot’ı Git deposuna ekleme.
- [x] Snapshot saklama politikasını belirle.
- [x] En az production’daki mevcut ve bir önceki snapshot’ı sakla.

## 2.3. Kaynak dosya şeması kontrolü

- [x] Arşivde `games.csv` olduğunu kontrol et.
- [x] Arşivde `appearances.csv` olduğunu kontrol et.
- [x] Arşivde `game_lineups.csv` olduğunu kontrol et.
- [x] Arşivde `players.csv` olduğunu kontrol et.
- [x] Arşivde `clubs.csv` olduğunu kontrol et.
- [x] Arşivde `countries.csv` olduğunu kontrol et.
- [x] Arşivde `transfers.csv` olduğunu kontrol et; oyun kaynağı değil QA kaynağı olarak işaretle.
- [x] Her dosyanın beklenen başlıklarını doğrula.
- [x] Beklenen sütun eksikse importu durdur.
- [x] Yeni, bilinmeyen sütunlar varsa uyarı üret ama güvenliyse importu durdurma.
- [x] Sütun tipleri beklenmedik biçimde değişmişse importu durdur.
- [x] CSV encoding ve ayırıcı kontrolü yap.

## 2.4. Veri sürümü tablosu

- [x] `dataset_versions` tablosunu tasarla.
- [x] Kaynak adını sakla.
- [x] Kaynak sürüm numarasını sakla.
- [x] Kaynak güncelleme tarihini sakla.
- [x] İndirme tarihini sakla.
- [x] Checksum sakla.
- [x] Import başlangıç zamanını sakla.
- [x] Import bitiş zamanını sakla.
- [x] Import durumunu sakla: pending, validating, ready, failed, active, archived.
- [x] Oyuncu sayısını sakla.
- [x] Kulüp sayısını sakla.
- [x] Maç sayısını sakla.
- [x] Oyuncu–kulüp–sezon ilişki sayısını sakla.
- [x] Aktif production sürümünü tekil hale getir.

## Faz 2 kabul kriterleri

- [x] Sabitlenmiş bir dcaribou sürümü tekrar indirilebiliyor.
- [x] İndirilen dosyanın bütünlüğü doğrulanıyor.
- [x] Kaynak şeması değiştiğinde pipeline sessizce yanlış veri üretmiyor.
- [x] Hangi sürümün production’da olduğu sorgulanabiliyor.

---

# FAZ 3 — PostgreSQL veri modeli ve migration’lar

## 3.1. Temel referans tabloları

- [x] `seasons` tablosunu oluştur.
- [x] `seasons.start_year` alanını oluştur.
- [x] `seasons.end_year` alanını oluştur.
- [x] `seasons.label` alanını oluştur.
- [x] `2012/13`–`2025/26` sezonlarını seed et.
- [x] `countries` tablosunu oluştur.
- [x] ISO ülke kodu alanını ekle.
- [x] Kaynak ülke adını sakla.
- [x] Türkçe görünen ülke adını sakla.
- [x] Konfederasyon/kıta alanını ekle.

## 3.2. Kulüp tabloları

- [x] `clubs` tablosunu oluştur.
- [x] Dahili UUID veya sayısal primary key seç.
- [x] `source_club_id` alanına dcaribou kulüp kimliğini koy.
- [x] `canonical_name` alanını ekle.
- [x] `display_name` alanını ekle.
- [x] `normalized_name` alanını ekle.
- [x] `city` alanını ekle.
- [x] `is_istanbul` alanını ekle.
- [x] `is_non_istanbul` alanını ekle.
- [x] `is_big_four` alanını ekle.
- [x] `is_active_in_scope` alanını ekle.
- [x] `source_url` alanını ekle.
- [x] `club_aliases` tablosunu oluştur.
- [x] Sponsor adlarını alias olarak saklamaya izin ver.
- [x] Eski yazım biçimlerini alias olarak saklamaya izin ver.
- [x] Alias’ın hangi tarih aralığında kullanıldığını isteğe bağlı sakla.
- [ ] Aynı hukuki devamlılıktaki kulüp adlarını tek canonical kulübe bağla.
- [x] Ayrı kulüpleri yanlışlıkla birleştirmemek için manuel onay alanı ekle.

## 3.3. Oyuncu tabloları

- [x] `players` tablosunu oluştur.
- [x] Dahili player primary key oluştur.
- [x] `source_player_id` alanına dcaribou kimliğini koy.
- [x] `display_name` alanını ekle.
- [x] `normalized_name` alanını ekle.
- [x] `first_name` alanını ekle.
- [x] `last_name` alanını ekle.
- [x] `date_of_birth` alanını ekle.
- [x] `country_of_birth_id` alanını ekle.
- [x] `citizenship_country_id` alanını ekle.
- [x] `raw_citizenship` alanını QA için sakla.
- [x] `position_group` alanını ekle.
- [x] `raw_position` alanını ekle.
- [x] `raw_sub_position` alanını ekle.
- [x] `preferred_foot` alanını ekle.
- [x] `height_cm` alanını ekle.
- [x] `source_url` alanını ekle.
- [x] `is_active_for_game` alanını ekle.
- [x] `review_status` alanını ekle.
- [x] `player_aliases` tablosunu oluştur.
- [ ] Türkçe karakter içermeyen arama alias’ı üret.
- [x] İsim sırası değişikliği için manuel alias’a izin ver.
- [x] Lakap veya yaygın kısa ad için manuel alias’a izin ver.
- [x] Aynı isimli oyuncuları doğum tarihi ve source ID ile ayır.

## 3.4. Maç ve kanıt tabloları

- [x] `matches` tablosunu oluştur.
- [x] `source_game_id` alanını ekle.
- [x] `season_id` alanını ekle.
- [x] `match_date` alanını ekle.
- [x] `home_club_id` alanını ekle.
- [x] `away_club_id` alanını ekle.
- [x] Skor alanlarını isteğe bağlı sakla.
- [x] `match_status` alanını ekle.
- [x] Durum değerlerini tanımla: played, awarded, cancelled, postponed, unknown.
- [x] `status_source` alanını ekle.
- [x] `is_player_evidence_allowed` alanını ekle.
- [x] Hükmen maçlarda bu alanı false yap.
- [x] `player_match_evidence` tablosunu oluştur.
- [x] `player_id` alanını ekle.
- [x] `match_id` alanını ekle.
- [x] `club_id` alanını ekle.
- [x] `evidence_type` alanını ekle.
- [x] Kanıt değerlerini tanımla: appearance, starting_lineup, substitute.
- [x] `minutes_played` kaynakta olsa bile oyun kuralına bağlama.
- [x] Aynı oyuncu–maç–kanıt türünü tekil yap.

## 3.5. Oyuncu–kulüp–sezon tablosu

- [x] `player_club_seasons` tablosunu oluştur.
- [x] `player_id` alanını ekle.
- [x] `club_id` alanını ekle.
- [x] `season_id` alanını ekle.
- [x] Üç alanı dataset sürümü içinde birlikte tekil yap.
- [x] `has_appearance` alanını ekle.
- [x] `has_start` alanını ekle.
- [x] `has_bench` alanını ekle.
- [x] `first_seen_date` alanını ekle.
- [x] `last_seen_date` alanını ekle.
- [x] `appearance_count` alanını ekle.
- [x] `lineup_count` alanını ekle.
- [x] `evidence_count` alanını ekle.
- [x] `evidence_level` alanını ekle.
- [x] `is_accepted_for_game` alanını ekle.
- [x] `review_status` alanını ekle.
- [x] `dataset_version_id` alanını ekle.

## 3.6. Kulüp–sezon ve şampiyonluk tabloları

- [x] `club_seasons` tablosunu oluştur.
- [x] `club_id` alanını ekle.
- [x] `season_id` alanını ekle.
- [x] Kulüp–sezon çiftini tekil yap.
- [x] `participated_in_super_lig` alanını ekle.
- [x] `is_champion` alanını ekle.
- [x] `championship_source_url` alanını ekle.
- [x] `championship_verified_at` alanını ekle.
- [x] `championship_verified_by` alanını ekle.
- [ ] Her sezonda tam bir şampiyon olmasını constraint veya QA testiyle doğrula.

## 3.7. Manuel düzeltme ve veri kalite tabloları

- [x] `data_overrides` tablosunu oluştur.
- [x] Override hedef tablo ve kayıt kimliğini sakla.
- [x] Önceki değeri sakla.
- [x] Yeni değeri sakla.
- [x] Gerekçeyi zorunlu yap.
- [x] Kaynak URL’sini isteğe bağlı değil, kritik düzeltmelerde zorunlu yap.
- [x] Değişikliği yapan yöneticiyi sakla.
- [x] Değişiklik zamanını sakla.
- [x] Override’ı geri alma alanı ekle.
- [x] `data_quality_issues` tablosunu oluştur.
- [x] Sorun türünü sakla.
- [x] Önem derecesini sakla.
- [x] İlgili kayıt kimliklerini sakla.
- [x] Açıklamayı sakla.
- [x] Durumu sakla: open, reviewing, resolved, ignored.
- [x] Çözüm notunu sakla.

## 3.8. İlk indeksler

- [x] `players(source_player_id)` için unique index ekle.
- [x] `players(normalized_name)` için arama indexi ekle.
- [x] `clubs(source_club_id)` için unique index ekle.
- [x] `player_club_seasons(player_id, season_id)` indexi ekle.
- [x] `player_club_seasons(club_id, season_id, player_id)` indexi ekle.
- [x] `player_club_seasons(position)` benzeri gereksiz indexleri gerçek sorgu ölçülmeden ekleme.
- [x] `player_match_evidence(match_id, club_id)` indexi ekle.
- [x] `club_seasons(season_id, is_champion)` indexi ekle.

## Faz 3 kabul kriterleri

- [x] Bütün tablolar migration ile sıfırdan kurulabiliyor.
- [x] Migration geri alma veya ileri düzeltme yöntemi belgeli.
- [x] Tabloların amacı şema belgesinde açıklanıyor.
- [x] Aynı kaynak kimliği iki farklı canonical kayda yanlışlıkla bağlanamıyor.
- [x] Temel sorgular için gerekli indeksler mevcut.

---

# FAZ 4 — dcaribou ETL ve canonical veri üretimi

## 4.1. Extract aşaması

- [ ] Snapshot arşivini açmadan dosya listesini doğrula.
- [ ] Sadece gereken CSV’leri işlemeyi planla.
- [ ] `games.csv` okuyucusunu yaz.
- [ ] `appearances.csv` okuyucusunu yaz.
- [ ] `game_lineups.csv` okuyucusunu yaz.
- [ ] `players.csv` okuyucusunu yaz.
- [ ] `clubs.csv` okuyucusunu yaz.
- [ ] `countries.csv` okuyucusunu yaz.
- [ ] `transfers.csv` okuyucusunu yalnızca QA/adayı desteklemek için yaz.
- [ ] Büyük CSV’leri chunk/stream yöntemiyle oku.
- [ ] Her dosyada okunan toplam satırı raporla.
- [ ] Bozuk satır bulunduğunda satırı sessizce atlama.
- [ ] Bozuk satırı hata raporuna yaz.
- [ ] Kritik dosyada bozuk satır varsa importu başarısız yap.

## 4.2. Süper Lig filtresi

- [ ] `competition_id = 'TR1'` filtresini uygula.
- [ ] `season >= 2012` filtresini uygula.
- [ ] `season <= 2025` filtresini uygula.
- [ ] Sezon dışı maçların içeri alınmadığını test et.
- [ ] Kupalar ve Avrupa maçlarının içeri alınmadığını test et.
- [ ] Millî takım maçlarının içeri alınmadığını test et.
- [ ] Filtre sonrası maç sayısını raporla.
- [ ] Referans snapshot için ham 4.618 ve dışlama sonrası 4.589 maç/karşılaşma kaydını regresyon başlangıç değeri olarak kaydet.
- [ ] Filtre sonrası sezon sayısını raporla.
- [ ] Tam 14 sezon olmasını doğrula.
- [ ] Filtre sonrası kulüp sayısını raporla.
- [ ] Referans snapshot için 43 kulübü regresyon başlangıç değeri olarak kaydet.
- [ ] Filtre sonrası kulüp–sezon sayısını raporla.
- [ ] Referans snapshot için 261 kulüp–sezonu regresyon başlangıç değeri olarak kaydet.

## 4.3. Sezon normalizasyonu

- [ ] `season = 2012` için başlangıç yılını 2012 yap.
- [ ] Bitiş yılını 2013 yap.
- [ ] Görünen etiketi `2012/13` üret.
- [ ] 1999/2000 benzeri sınırları destekleyecek genel yardımcı fonksiyon yaz.
- [ ] 2025 için `2025/26` üretildiğini test et.
- [ ] Tarih ile sezon etiketi uyuşmuyorsa QA uyarısı üret.

## 4.4. Kulüpleri içeri aktarma

- [ ] TR1 maçlarından kullanılan kaynak kulüp kimliklerini çıkar.
- [ ] Sadece bu kulüpleri `clubs.csv` içinden seç.
- [ ] Kaynak kulüp adını sakla.
- [ ] Canonical görünen adı referans dosyasından uygula.
- [ ] Türkçe karakter düzeltmelerini manuel referans dosyasında tut.
- [ ] Sponsor adını canonical ad yapma.
- [ ] Kulüp alias’larını seed et.
- [ ] 43 kulübün tamamının canonical eşleşmesi olduğunu doğrula.
- [ ] Eşleşmeyen kulüp varsa importu durdur.
- [ ] Birden fazla kaynak kulüp yanlışlıkla aynı canonical kulübe gidiyorsa manuel inceleme aç.

## 4.5. Ülkeleri normalleştirme

- [ ] `countries.csv` ülke adlarını içeri al.
- [ ] Kaynak vatandaşlık metniyle ülke tablosunu eşleştir.
- [ ] Büyük/küçük harf farklarını normalize et.
- [ ] Noktalama farklarını normalize et.
- [ ] Tarihsel veya alternatif ülke adları için alias tablosu oluştur.
- [ ] Eşleşmeyen vatandaşlıkları `unknown` yapmadan önce QA listesine çıkar.
- [ ] Uyruk bilinmiyorsa null bırak.
- [ ] Doğum ülkesini uyruk yerine otomatik kullanma.
- [ ] Kıta/konfederasyon bilgisini country ilişkisinden getir.

## 4.6. Oyuncuları içeri aktarma

- [ ] TR1 appearance ve lineup kayıtlarındaki kaynak player ID’leri çıkar.
- [ ] Snapshot sürümündeki oyuncu dışlama listesini kanıt ve oyuncu seçiminden önce uygula.
- [ ] `v677` için belirlenen dört kaynak player ID'sini ve 22 lineup satırını uygulama importundan çıkar.
- [ ] Sadece bu oyuncuları `players.csv` içinden seç.
- [ ] Oyuncu source ID’sini primary eşleştirme anahtarı olarak kullan.
- [ ] Oyuncu adını aktar.
- [ ] Ad ve soyadı aktar.
- [ ] Doğum tarihini parse et.
- [ ] Geçersiz doğum tarihini QA sorunu yap.
- [ ] Uyruk eşleşmesini uygula.
- [ ] Doğum ülkesi eşleşmesini uygula.
- [ ] Genel mevkiyi aktar.
- [ ] Ayrıntılı mevkiyi aktar.
- [ ] Ayak bilgisini aktar.
- [ ] Boy bilgisini aktar.
- [ ] Görsel URL’yi production şemasına almak zorunlu değil; alınırsa kullanılmadığını işaretle.
- [ ] Kaynak profil URL’sini aktar.
- [ ] Kaynakta olmayan oyuncu ID’si sürümlü dışlama listesinde değilse importu durdur.
- [ ] Referans snapshot için dışlama sonrası 3.770 kullanılabilir oyuncuyu regresyon başlangıç değeri olarak kaydet.

## 4.7. İsim normalizasyonu

- [ ] Unicode metni normalize et.
- [ ] Baş ve sondaki boşlukları kaldır.
- [ ] Birden fazla boşluğu teke indir.
- [ ] Arama için küçük harfe çevir.
- [ ] Türkçe `İ/I/ı/i` dönüşümlerini ayrı testlerle ele al.
- [ ] Türkçe karakter içermeyen yardımcı arama anahtarı üret.
- [ ] Tire ve apostrof farklarını arama için normalize et.
- [ ] Görünen adı değiştirme; sadece arama anahtarı üret.
- [ ] Fuzzy eşleşmeyi doğru cevap doğrulamasında kullanma.
- [ ] Kullanıcının arama sonucundan player ID seçmesini zorunlu yap.

## 4.8. Mevki normalizasyonu

- [ ] `Goalkeeper → GK` eşlemesini yaz.
- [ ] `Defender → DEF` eşlemesini yaz.
- [ ] `Midfield → MID` eşlemesini yaz.
- [ ] `Attack → FWD` eşlemesini yaz.
- [ ] `Missing` değerini null/unknown yap.
- [ ] Bilinmeyen yeni genel mevki gelirse importu uyarmakla kalmayıp durdur.
- [ ] Genel mevki doluluğunu raporla.
- [ ] Referans snapshot’ta sadece 5 belirsiz oyuncu olduğunu başlangıç değeri olarak kaydet.
- [ ] Ayrıntılı mevkileri aynen sakla.
- [ ] 2013/14 sonrası sezonluk modal ayrıntılı mevki üretimini isteğe bağlı yardımcı alan olarak planla.
- [ ] 2012/13 için oyuncu profil mevkisine geri dön.

## 4.9. Maç durumlarını belirleme

- [ ] Sürümlü dışlama listesinde olmayan her TR1 game kaydını `matches` staging tablosuna al.
- [ ] Aynı source game ID’nin tekrar etmediğini doğrula.
- [ ] Appearance veya lineup kanıtı olan maçı `played` adayı yap.
- [ ] Hiç oyuncu kanıtı olmayan maçı otomatik olarak kesin `awarded` sayma.
- [ ] Oyuncu kanıtı olmayan ve dışlama listesinde bulunmayan maçları QA listesine çıkar.
- [ ] `v677` için kararlaştırılan 29 maçı uygulama importundan çıkar.
- [ ] Dışlanan maçlardan staging, canonical maç veya oyuncu ilişkisi üretme.
- [ ] Gelecekteki snapshot'lar için sürüme bağlı manuel dışlama desteği kullan.
- [ ] Oynanmamış maçtan oyuncu ilişkisi üretilmediğini test et.

## 4.10. Appearance kanıtlarını oluşturma

- [ ] Appearance satırlarını TR1 game ID’leriyle sınırla.
- [ ] Her appearance satırını doğru sezona bağla.
- [ ] `player_club_id` değerini canonical kulübe bağla.
- [ ] Oyuncuyu canonical player kaydına bağla.
- [ ] Maçın ev sahibi veya deplasman kulüplerinden biriyle player club’ın uyuştuğunu doğrula.
- [ ] Uyuşmayan satırı QA sorunu yap.
- [ ] `evidence_type = appearance` kaydı oluştur.
- [ ] Aynı oyuncu–maç appearance tekrarını tekilleştir.
- [ ] Referans snapshot için 132.464 appearance satırını regresyon başlangıç değeri olarak kaydet.

## 4.11. Lineup kanıtlarını oluşturma

- [ ] Lineup satırlarını TR1 game ID’leriyle sınırla.
- [ ] `starting_lineup` değerini tanı.
- [ ] `substitutes` değerini tanı.
- [ ] Bilinmeyen lineup type gelirse QA hatası oluştur.
- [ ] Player ID’yi canonical oyuncuya bağla.
- [ ] Club ID’yi canonical kulübe bağla.
- [ ] Maçın ev/deplasman kulübüyle lineup club’ın uyuştuğunu doğrula.
- [ ] `starting_lineup` için `has_start` kanıtı üret.
- [ ] `substitutes` için `has_bench` kanıtı üret.
- [ ] Aynı oyuncu–maç–type tekrarını tekilleştir.
- [ ] 2012/13 lineup satırının sıfır olmasını bilinen kaynak sınırı olarak kabul et.
- [ ] Referans snapshot için ham 170.904 ve dışlama sonrası 170.882 lineup satırını regresyon başlangıç değeri olarak kaydet.

## 4.12. Oyuncu–kulüp–sezon ilişkisini toplama

- [ ] Appearance ve lineup kanıtlarını aynı staging görünümünde birleştir.
- [ ] Player, club ve season’a göre grupla.
- [ ] En az bir appearance varsa `has_appearance = true` yap.
- [ ] En az bir başlangıç varsa `has_start = true` yap.
- [ ] En az bir yedek kaydı varsa `has_bench = true` yap.
- [ ] İlk kanıt tarihini `first_seen_date` yap.
- [ ] Son kanıt tarihini `last_seen_date` yap.
- [ ] Appearance sayısını hesapla.
- [ ] Lineup sayısını hesapla.
- [ ] Toplam kanıt sayısını hesapla.
- [ ] Kanıtı olmayan ilişki üretme.
- [ ] Transfer tablosundan gelen ilişkiyi bu tabloya otomatik ekleme.
- [ ] Referans snapshot için dışlama sonrası 9.343 ilişkiyi regresyon başlangıç değeri olarak kaydet.
- [ ] Aynı player–club–season ilişkisinin tek satır olduğunu doğrula.
- [ ] İlişkideki kulübün o sezon Süper Lig’de olduğunu doğrula.

## 4.13. Transferleri QA adayı olarak kullanma

- [ ] Transfer tablosunu ayrı staging alanına al.
- [ ] Transfer tarihini parse et.
- [ ] Transfer sezonunu normalize et.
- [ ] TR1 kapsamındaki kulüplere gelen transferleri listele.
- [ ] TR1 kapsamındaki kulüplerden giden transferleri listele.
- [ ] Transfer olup player–club–season kanıtı olmayan kayıtları aday listeye çıkar.
- [ ] Bu adayları oyuna otomatik dahil etme.
- [ ] Aday kaydın daha sonra TFF ile doğrulanabilmesine izin ver.
- [ ] Transfer adayı üzerinden teammate ilişkisi üretme.

## 4.14. Staging’den canonical tablolara yükleme

- [ ] Importu transaction veya sürümlü staging yaklaşımıyla çalıştır.
- [ ] Önce staging tablolarını doldur.
- [ ] Staging kalite testlerini çalıştır.
- [ ] Test başarısızsa canonical tabloları değiştirme.
- [ ] Test başarılıysa yeni dataset version’a bağlı canonical kayıtları yaz.
- [ ] Aynı kaynak sürümün iki kez mükerrer yazılmasını engelle.
- [ ] Import özetini rapor dosyasına yaz.
- [ ] Başarılı importu `ready` durumuna getir.
- [ ] Manuel onay olmadan yeni sürümü `active` yapma.

## Faz 4 kabul kriterleri

- [ ] Tek komut sabitlenmiş snapshot’tan canonical veriyi üretiyor.
- [ ] İşlem tekrar çalıştırıldığında mükerrer kayıt oluşturmuyor.
- [ ] 14 sezon doğru etiketlerle mevcut.
- [ ] 43 kulüp eşleşmiş durumda.
- [ ] Referans sayılar açıklanabilir fark sınırları içinde.
- [ ] 2012/13 kaynak sınırı açıkça raporlanıyor.
- [ ] Hükmen maçlardan oyuncu ilişkisi oluşmuyor.
- [ ] Transfer-only kayıtlar oyuna girmiyor.

---

# FAZ 5 — Manuel referans verileri ve veri kalite güvencesi

## 5.1. Kulüp canonical isimleri

- [ ] 43 kulübün kaynak ID listesini dışa aktar.
- [ ] Her kaynak kulüp için canonical Türkçe ad belirle.
- [ ] `Fenerbahce` değerini `Fenerbahçe` olarak göster.
- [ ] `Caykur Rizespor` değerini `Çaykur Rizespor` olarak göster.
- [ ] `Basaksehir FK` değerini uygun görünen ada dönüştür.
- [ ] `Eskisehirspor` değerini `Eskişehirspor` olarak göster.
- [ ] `Elazigspor` değerini `Elazığspor` olarak göster.
- [ ] `Kasimpasa` değerini `Kasımpaşa` olarak göster.
- [ ] `Balikesirspor` değerini `Balıkesirspor` olarak göster.
- [ ] Kaynakta fesih notu bulunan kulüp adlarını kullanıcıya temiz adla göster.
- [ ] Kulüp adlarının tümünü bir kişi, ardından ikinci bir kişi gözden geçirsin.

## 5.2. Kulüp şehirleri ve etiketleri

- [ ] 43 kulübün merkez şehrini doldur.
- [ ] İstanbul merkezli kulüpleri listele.
- [ ] İstanbul etiketlerini ikinci kez doğrula.
- [ ] İstanbul dışındaki kulüpleri `is_non_istanbul = true` yap.
- [ ] Dört Büyük kulüpleri `is_big_four = true` yap.
- [ ] Dört Büyük olmayan bütün kulüplerde alanın false olduğunu doğrula.
- [ ] İstanbul/İstanbul dışı alanlarının birbirinin mantıksal tersi olduğunu doğrula.
- [ ] Şehri bilinmeyen kulüp bırakma.
- [ ] Kulüp etiketleri için kaynak/not alanı tut.

## 5.3. Sezon şampiyonları

- [ ] 2012/13 şampiyonunu doğrula ve ekle.
- [ ] 2013/14 şampiyonunu doğrula ve ekle.
- [ ] 2014/15 şampiyonunu doğrula ve ekle.
- [ ] 2015/16 şampiyonunu doğrula ve ekle.
- [ ] 2016/17 şampiyonunu doğrula ve ekle.
- [ ] 2017/18 şampiyonunu doğrula ve ekle.
- [ ] 2018/19 şampiyonunu doğrula ve ekle.
- [ ] 2019/20 şampiyonunu doğrula ve ekle.
- [ ] 2020/21 şampiyonunu doğrula ve ekle.
- [ ] 2021/22 şampiyonunu doğrula ve ekle.
- [ ] 2022/23 şampiyonunu doğrula ve ekle.
- [ ] 2023/24 şampiyonunu doğrula ve ekle.
- [ ] 2024/25 şampiyonunu doğrula ve ekle.
- [ ] 2025/26 şampiyonunu doğrula ve ekle.
- [ ] Her satıra resmi kaynak URL’si ekle.
- [ ] Her sezonda tam bir şampiyon olduğunu test et.
- [ ] Şampiyon kulübün ilgili sezon `club_seasons` kaydına sahip olduğunu test et.

## 5.4. Maç kapsamı dışlamaları

- [ ] Oyuncu kanıtı olmayan bütün game kayıtlarını raporla.
- [ ] Snapshot sürümüne bağlı maç dışlama referansını importtan önce yükle.
- [ ] `v677` için belirlenen 29 kaynak game ID'sinin tamamını uygulama importundan çıkar.
- [ ] Dışlama listesindeki kimlik tekrarlarını ve snapshot sürümü uyumunu doğrula.
- [ ] Dışlama kararının resmî maç durumu sınıflandırması olmadığını metadata içinde koru.
- [ ] Oynanmış ama lineup eksik maçları awarded olarak yanlış işaretleme.
- [ ] Appearance varsa maçı played kabul et.
- [ ] Ne appearance ne lineup olan ve dışlama listesinde bulunmayan maçı `unknown` yap ve importu production için engelle.

## 5.5. Oyuncu alanı kalite kontrolleri

- [ ] Player source ID null sayısını kontrol et; sıfır olmalı.
- [ ] Oyuncu adı null sayısını kontrol et; sıfır olmalı.
- [ ] Aynı source player ID’nin birden fazla oyuncuya gitmediğini doğrula.
- [ ] Uyruk doluluk oranını raporla.
- [ ] Uyruk eksik oyuncuları manuel inceleme kuyruğuna al.
- [ ] Genel mevki doluluk oranını raporla.
- [ ] Belirsiz beş civarı oyuncuyu manuel inceleme kuyruğuna al.
- [ ] Doğum tarihi gelecekte olan oyuncu olmadığını doğrula.
- [ ] Mantıksız yaş değerlerini raporla.
- [ ] Boy alanını oyun kriterine bağlamadığımızı doğrula.
- [ ] Aynı isimli farklı oyuncular için ayrı ID’lerin korunduğunu doğrula.

## 5.6. İlişki kalite kontrolleri

- [ ] Her player–club–season ilişkisinin en az bir kanıtı olduğunu doğrula.
- [ ] `has_appearance = true` ilişkilerin appearance kanıtı olduğunu doğrula.
- [ ] `has_start = true` ilişkilerin starting lineup kanıtı olduğunu doğrula.
- [ ] `has_bench = true` ilişkilerin substitutes kanıtı olduğunu doğrula.
- [ ] `first_seen_date <= last_seen_date` olduğunu doğrula.
- [ ] Kanıt tarihinin ilgili sezon aralığında olduğunu doğrula.
- [ ] Oyuncu kulübünün maçtaki iki kulüpten biri olduğunu doğrula.
- [ ] Bir sezonda olağan dışı sayıda kulübe bağlı oyuncuları raporla.
- [ ] Aynı maçta iki kulüp adına görünen oyuncuları raporla.
- [ ] Tek kanıtlı ilişkileri ayrı kalite grubunda raporla.
- [ ] Manuel pasife alınan ilişkinin kural sonuçlarına girmediğini test et.

## 5.7. Bilinen oyuncu regresyon listesi

- [ ] Her sezondan en az beş tanınan oyuncu seç.
- [ ] Büyük kulüplerden örnek oyuncular seç.
- [ ] Anadolu/İstanbul dışı kulüplerden örnek oyuncular seç.
- [ ] Sezon içinde takım değiştiren oyuncu örnekleri seç.
- [ ] Kaleci, defans, orta saha ve forvet örnekleri seç.
- [ ] Yabancı uyruk örnekleri seç.
- [ ] Aynı isimli oyuncu örneği seç.
- [ ] Bu oyuncuların beklenen kulüp–sezon ilişkilerini fixture dosyasına yaz.
- [ ] Her veri güncellemesinde fixture listesini otomatik test et.
- [ ] Fixture bozulursa yeni sürümü production’a alma.

## 5.8. Veri kalite raporu

- [ ] Raporun başına dataset version yaz.
- [ ] Sezon sayısını yaz.
- [ ] Maç sayısını yaz.
- [ ] Kulüp sayısını yaz.
- [ ] Oyuncu sayısını yaz.
- [ ] Oyuncu–kulüp–sezon ilişki sayısını yaz.
- [ ] Uyruk doluluk oranını yaz.
- [ ] Mevki doluluk oranını yaz.
- [ ] Açık kalite sorunlarının sayısını yaz.
- [ ] Kritik sorunları ayrı bölümde göster.
- [ ] Önceki sürüme göre eklenen/silinen kayıtları göster.
- [ ] Rapor başarısızsa production aktivasyonunu engelle.

## Faz 5 kabul kriterleri

- [ ] Bütün kulüpler canonical isim ve şehir bilgisine sahip.
- [ ] İstanbul/İstanbul dışı ve Dört Büyük etiketleri doğrulanmış.
- [ ] 14 sezonun şampiyonları resmi kaynakla doğrulanmış.
- [ ] Açıklanamayan oyuncusuz maç kalmamış.
- [ ] Kritik veri kalite sorunu açık değil.
- [ ] Bilinen oyuncu regresyon testleri geçiyor.

---

# FAZ 6 — Kural motoru ve cevap kümeleri

## 6.1. Ortak kural sözleşmesi

- [ ] Her kural için değişmeyen bir `rule_id` tanımla.
- [ ] Her kural için kullanıcıya gösterilecek Türkçe başlık tanımla.
- [ ] Her kural için kısa açıklama tanımla.
- [ ] Her kural için yönetici açıklaması tanımla.
- [ ] Her kural için `rule_type` tanımla.
- [ ] Parametreli kurallar için parametre şeması tanımla.
- [ ] Parametrelerin veri tiplerini tanımla.
- [ ] Zorunlu ve isteğe bağlı parametreleri ayır.
- [ ] Parametrelerin izin verilen değerlerini doğrula.
- [ ] Kuralın aktif/pasif durumunu sakla.
- [ ] Kuralın hangi dataset sürümünde hesaplandığını sakla.
- [ ] Kural sorgusunun sürümünü sakla.
- [ ] Kuralın son hesaplanma zamanını sakla.
- [ ] Kuralın ürettiği oyuncu sayısını sakla.
- [ ] Kural sonucunu oyuncu ID kümesi olarak temsil et.
- [ ] Aynı kuralın yazım farklarıyla tekrar oluşturulmasını engelle.
- [ ] Oyunda görünen başlık ile teknik sorguyu birbirinden ayır.
- [ ] Kural metinlerinin çeviri desteğine uygun tutulmasını sağla.

## 6.2. Kulüp kuralı

- [ ] Parametre olarak canonical kulüp ID’si al.
- [ ] En az bir geçerli oyuncu–kulüp–sezon ilişkisi olan oyuncuları döndür.
- [ ] Transfer kaydında bulunup kadro/maç kanıtı olmayan oyuncuyu döndürme.
- [ ] Aynı kulübün eski ve yeni adlarını tek kulüp altında değerlendir.
- [ ] Sezon içinde kulüp değiştiren oyuncuyu iki kulüp kuralında da kabul et.
- [ ] Ödüllendirilmiş maçtan oyuncu ilişkisi üretme.
- [ ] 2012/13 sezonunun yalnızca oynadığı kanıtlanan oyuncuları kapsadığını yardım metninde belirt.
- [ ] Kulüp kuralı için pozitif ve negatif örnek testleri yaz.

## 6.3. Uyruk ve kıta kuralları

- [ ] Oyuncunun canonical uyruğunu kullan.
- [ ] Birden fazla uyruğu destekleme kararını veri şemasında açık tut.
- [ ] MVP’de birincil uyruğun mu tüm uyrukların mı kabul edildiğini karara bağla.
- [ ] Bu kararı oyun yardım metnine yaz.
- [ ] Türkiye uyruk kuralını test et.
- [ ] En az beş farklı yabancı uyruk için test yaz.
- [ ] Eksik uyruğa sahip oyuncuyu hiçbir uyruk kuralına sokma.
- [ ] Ülkeleri kıtalara eşleyen sabit referans tablosu oluştur.
- [ ] Kıtalararası ülkeler için açık bir ürün kararı ver.
- [ ] Kıta eşlemesini veri kaynağından bağımsız ve sürümlü tut.
- [ ] Afrika, Avrupa, Güney Amerika, Kuzey/Orta Amerika, Asya ve Okyanusya kümelerini test et.

## 6.4. Mevki kuralı

- [ ] MVP’de dört ana mevkiyi kullan: kaleci, defans, orta saha, forvet.
- [ ] Kaynaktaki ayrıntılı mevkileri dört ana gruba eşle.
- [ ] Birden fazla mevkisi olan oyuncunun kabul mantığını belirle.
- [ ] Birincil mevki ile sezon bazlı mevki farkını belgeye yaz.
- [ ] Eksik mevkili oyuncuyu mevki kurallarından çıkar.
- [ ] Her ana mevki için en az on bilinen oyuncuyla regresyon testi yaz.
- [ ] Mevki dağılımının dataset sürümleri arasında anormal değişimini raporla.
- [ ] Sağ/sol bek gibi ayrıntılı mevkileri MVP sonrasına bırak.

## 6.5. Takım arkadaşlığı kuralı

- [ ] İki oyuncuyu aynı canonical kulüp ve aynı sezonda bulunmalarıyla takım arkadaşı say.
- [ ] Aynı maçta birlikte oynama zorunluluğu koyma.
- [ ] Sezon içi transferlerde tarih çakışması zorunluluğu olmadığını açıkça yaz.
- [ ] Oyuncunun kendisini kendi takım arkadaşı sayma.
- [ ] `player_season_club` tablosundan takım arkadaşlığı ilişkisi üret.
- [ ] Aynı ikiliyi ters sırayla ikinci kez saklama.
- [ ] İlişkinin kanıtı olan kulüp–sezon çiftlerini sakla.
- [ ] Birden fazla ortak sezon varsa hepsini kanıt listesinde tut.
- [ ] Aşırı büyük ara tabloyu önlemek için ön hesaplama ile sorgu anı hesaplamasını karşılaştır.
- [ ] MVP için daha düşük maliyetli yöntemi seç ve karar kaydına yaz.
- [ ] Belirli bir oyuncuyla takım arkadaşı olanlar kuralını üret.
- [ ] Arama ekranında aynı isimli hedef oyuncuları ayırt edecek kulüp/sezon bilgisi göster.
- [ ] Pozitif, negatif ve sezon içi transfer sınır testi yaz.

## 6.6. Şampiyon kadro kuralı

- [ ] Her sezonun şampiyon kulübünü manuel doğrulanmış tablodan al.
- [ ] Şampiyon kulübün o sezondaki geçerli oyuncularını döndür.
- [ ] Oyuncunun şampiyonluk maçında oynamasını şart koşma.
- [ ] Oyuncunun sezonun tamamında kulüpte kalmasını şart koşma.
- [ ] Sezon içinde ayrılan veya gelen oyuncunun kabul politikasını açıkça yaz.
- [ ] MVP’de geçerli `player_season_club` ilişkisi varsa kabul et.
- [ ] “Süper Lig’de herhangi bir sezonda şampiyon kadroda bulundu” birleşik kuralını üret.
- [ ] “Belirli sezonda şampiyon kadroda bulundu” kuralını yönetim panelinde destekle.
- [ ] Şampiyonluk sayısını ileride kullanılabilecek türetilmiş alan olarak hesapla.
- [ ] 14 sezonun tamamı için örnek oyuncularla test yaz.

## 6.7. Kulüp grubu kuralları

- [ ] İstanbul takımı tanımını kulübün şehir etiketi üzerinden yap.
- [ ] İstanbul takımlarında oynamış oyuncular kümesini üret.
- [ ] İstanbul dışı takımda oynamış oyuncular kümesini üret.
- [ ] Kullanıcı metninde “Anadolu takımı” yerine hukuki/ürün açısından daha açık “İstanbul dışı takım” ifadesini değerlendirmeye al.
- [ ] “Anadolu takımı” kullanılacaksa tanımını yardım ekranında açıkça yaz.
- [ ] Dört Büyük kulüp listesini sürümlü referans tablosunda tut.
- [ ] Dört Büyük’de oynamış oyuncular kümesini üret.
- [ ] Dört Büyük dışı takımda oynamış oyuncular kümesini üret.
- [ ] Bir oyuncunun hem İstanbul hem İstanbul dışı kümelerinde olabileceğini kabul et.
- [ ] Bir oyuncunun hem Dört Büyük hem Dört Büyük dışı kümelerinde olabileceğini kabul et.
- [ ] Grup kurallarını kulüp adı metnine göre değil kulüp ID’sine göre hesapla.
- [ ] Her grup kuralı için pozitif ve negatif test yaz.

## 6.8. Kariyer genişliği kuralları

- [ ] Oyuncunun oynadığı benzersiz Süper Lig kulübü sayısını hesapla.
- [ ] Oyuncunun yer aldığı benzersiz Süper Lig sezonu sayısını hesapla.
- [ ] Aynı kulüpte farklı sezonları kulüp sayısında bir kez say.
- [ ] Aynı sezonda iki kulübü sezon sayısında bir kez say.
- [ ] “En az 2/3/4/5 Süper Lig kulübünde oynadı” kural seçeneklerini üret.
- [ ] “En az 2/3/5/8 Süper Lig sezonunda yer aldı” seçeneklerini üret.
- [ ] Her eşiğin cevap sayısını veri üzerinde ölç.
- [ ] Çok az cevap üreten eşikleri otomatik üretim havuzuna alma.
- [ ] Eşik değerlerini kod içine gömmek yerine kural parametresi olarak sakla.

## 6.9. Dönem kuralları

- [ ] Dönemi başlangıç ve bitiş sezonu ile tanımla.
- [ ] Sezon aralığının iki ucunu da dahil et.
- [ ] “2012/13–2015/16 arasında ligde yer aldı” benzeri kurallar üret.
- [ ] Dönem genişliği için en az iki sezon sınırı koy.
- [ ] Tek sezonluk kuralı yalnızca yeterli cevap varsa yönetici seçimine aç.
- [ ] Dönem ile kulüp kuralı kesişimini test et.
- [ ] Dönem başlıklarını kullanıcıya kısa ve anlaşılır göster.
- [ ] 2012/13 veri kapsamı farkını dönem kuralı yardımında belirt.

## 6.10. Kural sonucu üretme ve önbellek

- [ ] Her aktif kuralın oyuncu ID listesini dataset yayını sırasında hesapla.
- [ ] Sonuçları `rule_player_membership` benzeri bir tabloda sakla.
- [ ] Aynı üyeliği birden fazla kez eklemeyi engelleyen benzersiz indeks oluştur.
- [ ] Üyelikleri dataset version ile ilişkilendir.
- [ ] Kural değişirse eski sonucu silmeden yeni sürüm üret.
- [ ] Hesaplama yarıda kalırsa aktif sürümü değiştirme.
- [ ] Tüm kurallar başarıyla hesaplanınca sürümü atomik olarak aktifleştir.
- [ ] Kural başına hesaplama süresini ölç.
- [ ] Kural başına cevap sayısını ölç.
- [ ] Sıfır cevaplı kuralları hata olarak raporla.
- [ ] Beklenmedik derecede geniş kuralları uyarı olarak raporla.
- [ ] Bir oyuncunun kurala neden uyduğunu açıklayan kanıt kaydına erişim sağla.

## 6.11. Kesişim servisi

- [ ] İki kuralın kesişimindeki benzersiz oyuncu sayısını hesapla.
- [ ] Kesişim oyuncularını yalnızca sunucu tarafında tut.
- [ ] Aynı kural çiftinin ters sırasını aynı sonuç olarak değerlendir.
- [ ] Kural çifti sonuçlarını dataset version ile önbelleğe al.
- [ ] Kesişim hesaplama süresini ölç.
- [ ] Sıfır sonuçlu kesişimleri işaretle.
- [ ] Bir sonuçlu kesişimleri riskli olarak işaretle.
- [ ] Cevap sayısı alt sınırının altındaki kesişimleri otomatik grid dışında bırak.
- [ ] Bilinen kural çiftleri için regresyon fixture’ı oluştur.
- [ ] Yeni dataset sürümünde kesişim sayısı sert değişirse uyarı üret.

## Faz 6 kabul kriterleri

- [ ] MVP’de kullanılacak bütün kural tipleri sunucuda çalışıyor.
- [ ] Her kural için cevap kümesi ve kanıtı üretilebiliyor.
- [ ] Takım arkadaşlığı aynı kulüp–sezon tanımıyla doğru çalışıyor.
- [ ] Şampiyon, İstanbul dışı ve Dört Büyük kuralları manuel referans verileriyle doğrulanıyor.
- [ ] Kurallar dataset sürümüyle tekrar üretilebiliyor.
- [ ] Kural ve kesişim testleri geçiyor.

---

# FAZ 7 — Grid üreticisi ve zorluk dengesi

## 7.1. Zorluk ölçümünün tanımı

- [ ] Hücre zorluğunu yalnızca cevap sayısıyla eşitleme.
- [ ] İlk gösterge olarak geçerli cevap sayısını kullan.
- [ ] Oyuncu tanınırlığı için eldeki ücretsiz sinyalleri listele.
- [ ] Tanınırlık sinyali yoksa MVP’de manuel editör puanı kullan.
- [ ] Büyük kulüpte oynama, yakın sezon ve çok sezon oynama gibi yaklaşık sinyalleri değerlendir.
- [ ] Yaklaşık sinyallerin kesin popülerlik ölçüsü olmadığını karar kaydına yaz.
- [ ] Hücre başına `answer_count` sakla.
- [ ] Hücre başına hesaplanan `difficulty_score` sakla.
- [ ] Hücre başına kolay/orta/zor etiketi sakla.
- [ ] Zorluk formülünün sürümünü sakla.
- [ ] Gerçek oyuncu başarı oranlarını yayından sonra zorluk kalibrasyonuna kat.

## 7.2. İlk zorluk eşikleri

- [ ] Başlangıçta 8’den az cevaplı hücreyi yayınlanamaz say.
- [ ] 8–14 cevaplı hücreyi “zor” adayı say.
- [ ] 15–39 cevaplı hücreyi “orta” adayı say.
- [ ] 40 ve üzeri cevaplı hücreyi “kolay” adayı say.
- [ ] Aşırı geniş hücreler için üst uyarı eşiği belirle.
- [ ] Bu sayıların ilk tahmin olduğunu açıkça yaz.
- [ ] Beta verisi geldikten sonra eşikleri güncelle.
- [ ] Eşik değişikliklerini sürümle.
- [ ] Geçmiş gridlerin zorluk etiketini geriye dönük değiştirme.
- [ ] Editörün hücre zorluğunu gerekçeyle değiştirebilmesine izin ver.

## 7.3. Kural adayı havuzu

- [ ] Aktif kural örneklerini aday havuzuna ekle.
- [ ] Sıfır veya alt sınır altında cevap üreten kural örneklerini çıkar.
- [ ] Eksik veri oranı yüksek kuralları çıkar.
- [ ] Veri kalitesi uyarısı açık olan kuralları çıkar.
- [ ] Aynı anlama gelen başlıkları benzerlik gruplarına ayır.
- [ ] Aynı gridde kullanılmaması gereken kural çiftlerini tanımla.
- [ ] Kulüp kuralı ile o kulübün grup kuralı arasındaki gereksiz tekrarları işaretle.
- [ ] Aynı hedef oyuncuya bağlı iki takım arkadaşlığı kuralını sınırla.
- [ ] Aynı ülke ve onun kıtasını aynı gridde kullanmayı sınırla.
- [ ] Aynı kulübü satır ve sütunda tekrar kullanmayı yasakla.
- [ ] Aday kurala son kullanım tarihi ekle.
- [ ] Yakın günlerde tekrar edilen kurallara ceza puanı ver.

## 7.4. 3×3 grid kompozisyon kuralları

- [ ] Her grid için üç satır ve üç sütun kuralı seç.
- [ ] Altı kuralın benzersiz olmasını sağla.
- [ ] Dokuz hücrenin tamamında en az sekiz geçerli cevap olmasını sağla.
- [ ] İlk hedef olarak gridde 2–3 kolay hücre bulundur.
- [ ] İlk hedef olarak gridde 4–5 orta hücre bulundur.
- [ ] İlk hedef olarak gridde en fazla 2 zor hücre bulundur.
- [ ] Hiçbir satırın üç hücresinin birden zor olmasına izin verme.
- [ ] Hiçbir sütunun üç hücresinin birden zor olmasına izin verme.
- [ ] Her satır ve sütunda en az bir kolay veya orta hücre bulunmasını sağla.
- [ ] Altı eksenden en az ikisinin genel kapsamlı olmasını sağla.
- [ ] Altı eksenden en fazla ikisinin dar kapsamlı olmasını sağla.
- [ ] İki takım arkadaşlığı kuralını karşı karşıya getirmenin sonuçlarını ayrıca denetle.
- [ ] Üçten fazla kulüp bazlı ekseni aynı gridde kullanma.
- [ ] Üçten fazla demografik/mevki eksenini aynı gridde kullanma.
- [ ] Aynı gridden tek bir oyuncunun aşırı sayıda hücreyi doldurabilmesini raporla.
- [ ] Grid toplam zorluk puanı için kabul aralığı belirle.

## 7.5. Tanınırlık güvenlik kontrolü

- [ ] Her hücrede en az kaç “tanınabilir” cevap isteneceğini belirle.
- [ ] İlk sürümde her hücre için editörce tanınabilir en az üç cevap hedefle.
- [ ] Yalnızca eski ve az bilinen oyunculardan oluşan hücreyi yayınlama.
- [ ] Yakın dönemden cevap içermeyen hücreyi uyarı olarak işaretle.
- [ ] Yalnızca tek bir kulüpte kısa süre görünen oyunculardan oluşan hücreyi uyar.
- [ ] Editör önizlemesinde cevapları tanınırlık sinyaline göre sırala.
- [ ] İlk 10 cevabı kolayca incelemeyi sağla.
- [ ] Editörün “oyuncular var ama kullanıcı açısından adil değil” gerekçesiyle hücreyi reddetmesini sağla.

## 7.6. Otomatik grid üretim algoritması

- [ ] Üretim için deterministik bir seed kabul et.
- [ ] Aynı dataset, ayar ve seed ile aynı gridi üret.
- [ ] Önce altı kural adayı seç.
- [ ] Dokuz kesişimi önbellekten getir.
- [ ] Geçersiz hücre varsa adayı reddet.
- [ ] Zorluk dağılımı uygun değilse adayı reddet.
- [ ] Tekrar/benzerlik kuralı ihlal edilirse adayı reddet.
- [ ] Tanınırlık kontrolü başarısızsa adayı reddet.
- [ ] Kabul edilen gride bileşik kalite puanı ver.
- [ ] En yüksek puanlı adayları editöre sırala.
- [ ] Her reddetme nedenini sayısal olarak kaydet.
- [ ] Belirlenen deneme sayısında grid bulunamazsa hata üret.
- [ ] Deneme sayısı ve süre sınırını yapılandırılabilir yap.
- [ ] Grid bulunamamasını sessizce düşük kaliteli grid yayınlayarak çözme.

## 7.7. Manuel grid oluşturma ve önizleme

- [ ] Editörün satır ve sütun kurallarını elle seçmesini sağla.
- [ ] Her seçimden sonra dokuz hücrenin cevap sayısını yeniden hesapla.
- [ ] Sıfır cevaplı hücreyi kırmızı göster.
- [ ] Alt sınırdaki hücreyi uyarı rengiyle göster.
- [ ] Hücrelerin kolay/orta/zor dağılımını göster.
- [ ] Her hücrenin örnek cevaplarını yalnızca yöneticiye göster.
- [ ] Benzer kural uyarılarını göster.
- [ ] Yakın günlerde kullanılan kural uyarısını göster.
- [ ] Grid kaydetmeden önce bütün doğrulamaları tekrar çalıştır.
- [ ] Manuel istisnada gerekçe girmeyi zorunlu yap.
- [ ] Manuel istisnaları audit log’a yaz.

## 7.8. Gerçek kullanım verisiyle kalibrasyon

- [ ] Hücre başına toplam tahmin sayısını ölç.
- [ ] Hücre başına doğru cevap oranını ölç.
- [ ] Hücre başına boş bırakılma oranını ölç.
- [ ] Hücre başına ortalama cevap süresini ölçmeyi değerlendirmeye al.
- [ ] İnternetten bakmayı teşvik eden aşırı zor hücre sinyallerini belirle.
- [ ] Editör zorluk etiketi ile gerçek başarı oranını karşılaştır.
- [ ] En az iki haftalık veri olmadan büyük eşik değişikliği yapma.
- [ ] Eşik değişikliğini A/B testi olmadan tüm geçmişe uygulama.
- [ ] Her kalibrasyon değişikliğini karar günlüğüne yaz.

## Faz 7 kabul kriterleri

- [ ] Üretici imkânsız kesişim içeren grid yayınlamıyor.
- [ ] Dokuz hücrenin tamamı minimum cevap eşiğini karşılıyor.
- [ ] Hiçbir satır veya sütun tamamen zor değil.
- [ ] Aynı dataset ve seed aynı gridi üretiyor.
- [ ] Editör cevap sayısı, zorluk ve örnek cevapları görebiliyor.
- [ ] Reddedilen grid adaylarının nedenleri izlenebiliyor.

---

# FAZ 8 — Günlük grid yaşam döngüsü

## 8.1. Grid veri modeli

- [ ] `grids` tablosunu oluştur.
- [ ] Grid tarihini `Europe/Istanbul` gününe göre sakla.
- [ ] Her grid için benzersiz slug üret.
- [ ] Gridin dataset version bilgisini sakla.
- [ ] Gridin kural motoru sürümünü sakla.
- [ ] Gridin zorluk formülü sürümünü sakla.
- [ ] Gridin seed bilgisini sakla.
- [ ] Grid durumunu `draft`, `approved`, `scheduled`, `published`, `archived` olarak tanımla.
- [ ] Altı eksenin konumunu saklayan tablo oluştur.
- [ ] Dokuz hücrenin satır/sütun konumunu sakla.
- [ ] Hücre başına cevap sayısını sakla.
- [ ] Hücre başına zorluk etiketini sakla.
- [ ] Grid oluşturma ve onaylayan yönetici bilgilerini sakla.
- [ ] Gridin oluşturulma, onaylanma ve yayınlanma zamanlarını sakla.

## 8.2. Geçerli cevap anlık görüntüsü

- [ ] Her hücrenin geçerli oyuncu ID listesini yayın öncesi dondur.
- [ ] Cevap listesini gridin dataset version’ıyla ilişkilendir.
- [ ] Sonraki veri güncellemesinin geçmiş gridi değiştirmesini engelle.
- [ ] Aynı oyuncunun bir hücrede bir kez bulunmasını sağla.
- [ ] Her cevabın iki kurala uyma kanıtını denetlenebilir tut.
- [ ] Cevap anlık görüntüsünü istemci API’sine hiçbir zaman gönderme.
- [ ] Cevap listesinin hash değerini bütünlük kontrolü için sakla.
- [ ] Yayınlanmış gridin cevap listesini doğrudan değiştirmeyi engelle.
- [ ] Acil düzeltmede yeni revision oluştur ve audit log tut.

## 8.3. Oluşturma, onay ve planlama

- [ ] Gelecek en az yedi gün için grid üretme işi oluştur.
- [ ] Otomatik üretilen gridleri `draft` durumunda kaydet.
- [ ] Editör incelemesi olmadan MVP’de otomatik yayın yapma.
- [ ] Editör onayında veri kalite durumunu yeniden kontrol et.
- [ ] Onaylanan grid için planlanan yayın tarihini seç.
- [ ] Aynı güne ikinci grid planlanmasını benzersiz kısıtla engelle.
- [ ] Geçmiş tarihe planlama yapılırsa onay iste.
- [ ] Yayından kısa süre önce tüm cevap snapshot’larını doğrula.
- [ ] Geçersiz grid varsa yayını durdur ve uyarı gönder.

## 8.4. Gün değişimi ve yayınlama

- [ ] Gün sınırını `Europe/Istanbul` saat dilimine göre hesapla.
- [ ] Yaz/kış saati kütüphane davranışını test et.
- [ ] 00.00’da planlanan gridi atomik olarak `published` yap.
- [ ] Aynı anda iki yayın işinin aynı gridi iki kez yayınlamasını engelle.
- [ ] Yayın işi kaçırılırsa uygulama isteği sırasında güvenli telafi mekanizması kur.
- [ ] Bugünün gridi yoksa kullanıcıya açıklayıcı bakım ekranı göster.
- [ ] Dünün gridini arşivle ancak erişilebilir tutma politikasını ürün kararına bağla.
- [ ] Gün değişiminde aktif oyun oturumlarının davranışını belirle.
- [ ] Başlanmış oyunun kendi grid sürümüyle tamamlanmasına izin ver.
- [ ] Yeni kullanıcıya yalnızca yeni günün gridini göster.

## Faz 8 kabul kriterleri

- [ ] Her yayınlanmış grid değişmez bir cevap snapshot’ına sahip.
- [ ] Aynı tarihte yalnızca bir günlük grid yayınlanabiliyor.
- [ ] Saat dilimi ve gün değişimi testleri geçiyor.
- [ ] Veri güncellemesi geçmiş grid cevaplarını değiştirmiyor.
- [ ] Onaysız veya kalite kontrolünden geçmemiş grid yayınlanmıyor.

---

# FAZ 9 — Backend ve oyun API’si

## 9.1. API temel yapısı

- [ ] API sürümleme biçimini belirle; örneğin `/api/v1`.
- [ ] Ortak başarı ve hata cevap biçimini tanımla.
- [ ] Makine tarafından okunabilir hata kodları tanımla.
- [ ] İstek doğrulama kütüphanesini seç.
- [ ] Bütün girişleri sunucu tarafında doğrula.
- [ ] API loglarına request ID ekle.
- [ ] Yapılandırılmış log formatı kullan.
- [ ] Sağlık kontrolü endpoint’i oluştur.
- [ ] Veritabanı erişim sağlık kontrolünü ayrı tut.
- [ ] API dokümantasyonu üret.
- [ ] Geliştirme dışı ortamlarda stack trace döndürme.

## 9.2. Günlük grid endpoint’i

- [ ] Bugünün yayınlanmış gridini döndüren endpoint oluştur.
- [ ] Yalnızca kullanıcıya gereken kural başlıklarını ve konumları döndür.
- [ ] Hücre cevap sayılarını oyun başlamadan döndürmeme kararını uygula.
- [ ] Geçerli cevap listesini veya tahmin edilebilir hash’ini döndürme.
- [ ] Dataset iç detaylarını istemciye sızdırma.
- [ ] Cache header politikasını belirle.
- [ ] Gün değişiminde eski cache’in servis edilmesini engelle.
- [ ] Grid yoksa tanımlı hata kodu döndür.

## 9.3. Oyun oturumu

- [ ] Anonim kullanıcı için güvenli oyun session ID üret.
- [ ] Session ID’yi tahmin edilemez yap.
- [ ] Session’ı belirli grid ID’sine bağla.
- [ ] Oturum başlangıç zamanını sakla.
- [ ] Doldurulan hücreleri sakla.
- [ ] Kullanılmış oyuncuları sakla.
- [ ] Oturum durumunu `active`, `completed`, `expired` olarak tut; kaybetme durumu oluşturma.
- [ ] Aynı tarayıcı yenilemesinde oyunu geri yükle.
- [ ] Aynı grid için tekrar oturum açma politikasını belirle.
- [ ] MVP’de hesap olmadan mutlak hile engelinin mümkün olmadığını açıkça kabul et.

## 9.4. Oyuncu arama endpoint’i

- [ ] Aramayı en az iki veya üç karakterden sonra başlat.
- [ ] Türkçe karakterleri doğru işle.
- [ ] Büyük/küçük harf farkını yok say.
- [ ] Aksan ve yaygın yazım varyantlarını normalize et.
- [ ] Oyuncu alias tablosunu aramaya kat.
- [ ] Sonuçlarda canonical oyuncu adını göster.
- [ ] Aynı isimli oyuncuları ayırmak için uyruk ve kısa kariyer özeti döndür.
- [ ] Arama sonucunu seçilen hücrenin geçerli cevaplarıyla sınırlama.
- [ ] Böylece arama endpoint’inin doğru cevabı elemesini engelle.
- [ ] Sonuç sayısına üst sınır koy.
- [ ] Çok sık aramaya oran sınırı uygula.
- [ ] Arama sorgularında indeks kullanımını doğrula.

## 9.5. Tahmin endpoint’i

- [ ] İstekten session ID, grid ID, hücre konumu ve oyuncu ID al.
- [ ] Gridin session ile aynı olduğunu doğrula.
- [ ] Hücre konumunun geçerli olduğunu doğrula.
- [ ] Session’ın aktif olduğunu doğrula.
- [ ] Hücrenin daha önce doldurulmadığını doğrula.
- [ ] Oyuncunun aynı oyunda daha önce kullanılmadığını doğrula.
- [ ] Oyuncunun cevap snapshot’ında olup olmadığını sunucuda kontrol et.
- [ ] Doğru cevapta hücreyi oyuncuyla kilitle.
- [ ] Yanlış cevapta hücreyi ve session’ı aktif bırak; herhangi bir hak sayacı değiştirme.
- [ ] Yanlış cevaplanan oyuncuyu kullanılmış oyuncular listesine ekleme.
- [ ] Dokuz hücre dolduğunda session’ı `completed` yap.
- [ ] Aynı isteğin ağ nedeniyle tekrarlanmasına karşı idempotency uygula.
- [ ] Tahmin işlemini tek veritabanı transaction’ında tamamla.
- [ ] Eşzamanlı iki tahminin session durumunu bozmasını engelle.
- [ ] Cevapta yalnızca doğru/yanlış sonucunu ve güncel oyun durumunu döndür.
- [ ] Yanlış cevapta geçerli oyuncu listesini döndürme.

## 9.6. Oyun durumu ve sonuç endpoint’leri

- [ ] Aktif session durumunu döndüren endpoint oluştur.
- [ ] Yalnızca o session’da açılmış oyuncuları döndür.
- [ ] Oyun bitmeden diğer geçerli cevapları döndürme.
- [ ] Oyun bittikten sonra cevap örnekleri gösterilecekse kapsamını belirle.
- [ ] Sonuç ekranı için doğru hücre sayısını döndür.
- [ ] Kullanılan tahmin sayısını döndür.
- [ ] Tamamlama süresini göstermeye karar verilirse sunucuda hesapla.
- [ ] Rarity özelliği açıksa hücre puanlarını döndür.
- [ ] Paylaşım metni için yalnızca emoji/renk matrisi üretilecek veriyi döndür.

## 9.7. Veri sorunu bildirme endpoint’i

- [ ] Kullanıcının grid, hücre ve oyuncu üzerinden sorun bildirmesini sağla.
- [ ] “Bu cevap doğru olmalıydı”, “bu cevap yanlış kabul edildi”, “isim hatası” kategorileri tanımla.
- [ ] Serbest metin uzunluğunu sınırla.
- [ ] Kötüye kullanım oran sınırı koy.
- [ ] Bildirime session ve dataset version bağla.
- [ ] Yönetici panelinde inceleme durumu sakla.
- [ ] Kişisel veri toplamadan geri bildirim almayı tercih et.

## Faz 9 kabul kriterleri

- [ ] Geçerli cevap kontrolü tamamen sunucu tarafında yapılıyor.
- [ ] API hiçbir endpoint’te tüm hücre cevaplarını sızdırmıyor.
- [ ] Yenileme sonrası oyun durumu geri yüklenebiliyor.
- [ ] Aynı oyuncu tek oyunda ikinci kez kullanılamıyor.
- [ ] Eşzamanlı ve tekrarlanan tahmin istekleri doğru ele alınıyor.
- [ ] Arama aynı isimli oyuncuları ayırt edebiliyor.

---

# FAZ 10 — Web arayüzü ve oyun deneyimi

## 10.1. Bilgi mimarisi ve ekranlar

- [ ] Ana oyun ekranını tanımla.
- [ ] İlk kullanım açıklamasını tanımla.
- [ ] Nasıl oynanır ekranını tanımla.
- [ ] Kurallar ve veri kapsamı ekranını tanımla.
- [ ] Sonuç ekranını tanımla.
- [ ] Geçmiş oyunlar ekranının MVP’de olup olmayacağını belirle.
- [ ] Veri sorunu bildirme ekranını tanımla.
- [ ] Gizlilik ve kullanım koşulları sayfalarını tanımla.
- [ ] Bakım ve grid bulunamadı ekranlarını tasarla.

## 10.2. Görsel sistem

- [ ] Renk paletini seç.
- [ ] Doğru, yanlış, seçili, kilitli ve boş durum renklerini belirle.
- [ ] Renk körlüğünde yalnızca renge bağlı olmayan işaretler kullan.
- [ ] Yazı tipini ve başlık ölçeklerini belirle.
- [ ] Buton, kart, modal ve input bileşenlerini tanımla.
- [ ] Masaüstü, tablet ve telefon aralıklarını belirle.
- [ ] 3×3 gridin küçük telefon ekranında taşmamasını sağla.
- [ ] Uzun kural başlıklarının satır yüksekliğini bozmamasını sağla.
- [ ] Logo ve oyuncu yüzü olmadan da güçlü bir bilgi hiyerarşisi kur.
- [ ] Yükleme iskeleti ve hata durumlarını tasarla.

## 10.3. 3×3 grid bileşeni

- [ ] Üç satır başlığını göster.
- [ ] Üç sütun başlığını göster.
- [ ] Dokuz hücreyi klavye ve dokunmayla seçilebilir yap.
- [ ] Seçili hücrenin iki kriterini açıkça göster.
- [ ] Dolu hücrede oyuncu adını göster.
- [ ] Dolu hücreyi yeniden seçmeyi engelle veya bilgi görünümüne çevir.
- [ ] Doğru cevap animasyonunu kısa ve erişilebilir tut.
- [ ] Yanlış cevap geri bildirimini utandırıcı/agresif olmayan biçimde ver.
- [ ] Hücre yüksekliklerini tutarlı tut.
- [ ] Ekran okuyucuya hücre koordinatı ve iki kriteri okut.
- [ ] Mobilde yanlış dokunmayı azaltacak hedef boyutu kullan.

## 10.4. Oyuncu arama ve seçim akışı

- [ ] Hücre seçildiğinde arama modalı veya paneli aç.
- [ ] İki kriteri arama alanının üstünde tekrar göster.
- [ ] Yazarken gecikmeli arama uygula.
- [ ] Çok kısa sorguda yardımcı metin göster.
- [ ] Sonuçlarda oyuncu adını öne çıkar.
- [ ] Aynı isimli oyuncular için ayırt edici bilgiyi göster.
- [ ] Klavyeyle sonuçlar arasında gezinmeyi destekle.
- [ ] Enter ile seçimi destekle.
- [ ] Escape ile kapatmayı destekle.
- [ ] Seçimden önce oyuncu adını kullanıcıya tekrar göster.
- [ ] Çift tıklama/çift dokunmada iki tahmin gönderilmesini engelle.
- [ ] İstek sürerken butonu kilitle.
- [ ] Ağ hatasında tahmini kaybetmeden tekrar deneme sun.
- [ ] Yanlış cevap sonrası arama sorgusunu temizleme davranışını belirle.

## 10.5. Sınırsız tahmin ve oyun ilerlemesi

- [ ] Arayüzde yanlış tahmin hakkının sınırsız olduğunu açıkça belirt.
- [ ] Hak sayacı gösterme.
- [ ] Yanlış tahminde hücreyi açık tutan kısa ve erişilebilir geri bildirim göster.
- [ ] Doğru tahminde hücreyi kilitle ve ilerleme sayısını güncelle.
- [ ] Dokuz hücre tamamlanmadan session’ı kaybedilmiş veya bitmiş duruma getirme.
- [ ] Oyun bitince yeni tahmin girişini kapat.
- [ ] Sayfa yenilemesinde sunucudan gerçek durumu al.
- [ ] Tarayıcı yerel durumuyla sunucu çelişirse sunucuyu kaynak kabul et.
- [ ] Gün değişiminde açık sekmenin davranışını kullanıcıya açıkla.

## 10.6. İlk kullanım ve yardım metinleri

- [ ] Oyunun amacını tek paragrafta açıkla.
- [ ] Oyuncunun iki kriteri de karşılaması gerektiğini yaz.
- [ ] Bir oyuncunun aynı gridde yalnızca bir kez kullanılabileceğini yaz.
- [ ] Takım arkadaşlığının aynı kulüp ve aynı sezon anlamına geldiğini yaz.
- [ ] Aynı maçta oynama zorunluluğu olmadığını yaz.
- [ ] 2012/13 kapsamının maçta görünen oyuncularla sınırlı olduğunu yaz.
- [ ] 2013/14 sonrası kadro ve maç kaynaklarının birlikte kullanıldığını yaz.
- [ ] İstanbul dışı/Anadolu ve Dört Büyük tanımlarını yaz.
- [ ] Uyruk ve mevki kabul politikasını yaz.
- [ ] Veri hatası bildirmenin yolunu göster.

## 10.7. Sonuç ve paylaşım ekranı

- [ ] Doğru doldurulan hücre sayısını göster.
- [ ] Tamamlandı durumunu açıkça göster; kaybetme durumu gösterme.
- [ ] Gridin tarih/numarasını göster.
- [ ] Emoji veya renk karelerinden paylaşım matrisi oluştur.
- [ ] Paylaşım metninde oyuncu adlarını ifşa etme.
- [ ] Panoya kopyalama butonu ekle.
- [ ] Kopyalama başarısını kullanıcıya bildir.
- [ ] Web Share API destekleniyorsa mobil paylaşım sun.
- [ ] API desteklenmiyorsa kopyalama seçeneğine geri dön.
- [ ] Sonuç ekranından veri sorunu bildirmeye erişim ver.

## 10.8. Erişilebilirlik ve dil

- [ ] Arayüz dilini ilk sürümde Türkçe yap.
- [ ] HTML dilini `tr` olarak ayarla.
- [ ] Bütün input ve butonlara erişilebilir ad ver.
- [ ] Modal açılınca odağı modal içine taşı.
- [ ] Modal kapanınca odağı seçili hücreye döndür.
- [ ] Odak göstergesini görünür tut.
- [ ] Klavye kapanlarını test et.
- [ ] Canlı doğru/yanlış mesajlarını ekran okuyucuya duyur.
- [ ] Metin kontrastlarını WCAG AA seviyesine göre test et.
- [ ] Hareket azaltma tercihini destekle.
- [ ] Yüzde 200 yakınlaştırmada oyunun kullanılabilirliğini test et.

## Faz 10 kabul kriterleri

- [ ] Oyun telefon ve masaüstünde tamamlanabiliyor.
- [ ] Tüm oyun klavyeyle oynanabiliyor.
- [ ] Yenileme ve ağ hatası oyun durumunu bozmuyor.
- [ ] Kullanıcı takım arkadaşlığı ve veri kapsamı tanımlarını görebiliyor.
- [ ] Paylaşım çıktısı cevapları ifşa etmiyor.
- [ ] Temel erişilebilirlik denetimleri geçiyor.

---

# FAZ 11 — Puanlama, rarity ve istatistikler

## 11.1. MVP kapsam kararı

- [ ] Rarity puanının ilk yayında bulunup bulunmayacağını karara bağla.
- [ ] İlk yayına yetişmezse özelliği feature flag arkasında tut.
- [ ] Rarity olmadan temel başarı ölçüsünü doğru hücre sayısı olarak tanımla.
- [ ] Puanlama kuralını kullanıcıya açıklanabilir tut.
- [ ] Formül değişikliklerini sürümle.

## 11.2. Tahmin istatistikleri

- [ ] Grid–hücre–oyuncu bazında doğru seçim sayısını topla.
- [ ] Hücre bazında toplam doğru tahmin sayısını topla.
- [ ] Yanlış denemeleri oyuncu bazında kamuya açık istatistiğe katmama kararını değerlendir.
- [ ] Bot ve aşırı istekleri istatistikten ayıracak filtre tanımla.
- [ ] Aynı session’ın yinelenen isteğini bir kez say.
- [ ] İstatistiği tahmin transaction’ından güvenli şekilde üret.
- [ ] Sayaç güncellenemezse oyun sonucunu başarısız yapmama stratejisi kur.
- [ ] Ham event ile toplu sayaç arasında uzlaştırma işi oluştur.

## 11.3. Rarity formülü

- [ ] Temel oranı `oyuncu seçimi / hücredeki tüm doğru seçimler` olarak hesapla.
- [ ] Yeterli örnek yokken puanın aşırı oynamasını önle.
- [ ] Minimum örnek sayısı belirle.
- [ ] Gerekirse smoothing formülü kullan.
- [ ] İlk oyuncuların puanını sonradan sürekli değiştirmeme politikasını belirle.
- [ ] Oyun tamamlandığında puan snapshot’ı oluştur.
- [ ] Hücre başına rarity puanı üret.
- [ ] Toplam rarity puanını dokuz hücreden üret.
- [ ] Düşük puanın mı yüksek puanın mı daha iyi olduğunu açıkça göster.
- [ ] Formülü yardım ekranında sade dille açıkla.

## 11.4. Kullanıcı istatistikleri

- [ ] Hesapsız MVP’de cihaz bazlı istatistik tutulup tutulmayacağını belirle.
- [ ] Yerel istatistiğin silinebilir olduğunu kullanıcıya açıkla.
- [ ] Oynanan oyun sayısını hesapla.
- [ ] Kazanma sayısını hesapla.
- [ ] Kazanma oranını hesapla.
- [ ] Mevcut ve en uzun seriyi hesaplamayı sonraki sürüme ayırmayı değerlendir.
- [ ] Çerez/yerel depolama kullanımını gizlilik metninde belirt.
- [ ] Kullanıcı hesabı olmadan cihazlar arası senkronizasyon vaat etme.

## Faz 11 kabul kriterleri

- [ ] Puanlama kapalıyken oyun akışı eksiksiz çalışıyor.
- [ ] Puanlama açıksa tekrarlı istekler istatistiği şişirmiyor.
- [ ] Rarity formülü sürümlü ve kullanıcıya açıklanabilir.
- [ ] Düşük örnek sayısında yanıltıcı kesinlik gösterilmiyor.
- [ ] Paylaşım ve sonuç puanları cevap verisini sızdırmıyor.

---

# FAZ 12 — Yönetim paneli ve editör operasyonu

## 12.1. Yönetici erişimi

- [ ] Yönetim panelini normal oyun alanından ayrı bir route altında tut.
- [ ] Yönetici giriş sistemi oluştur.
- [ ] Güçlü parola politikasını uygula.
- [ ] Mümkünse çok faktörlü kimlik doğrulamayı zorunlu tut.
- [ ] `viewer`, `editor` ve `admin` rollerini tanımla.
- [ ] Her yönetim işlemi için rol kontrolü yap.
- [ ] Başarısız girişleri oran sınırına bağla.
- [ ] Yönetici oturum süresini sınırla.
- [ ] Oturum sonlandırma özelliği ekle.
- [ ] Yönetici işlemlerini audit log’a yaz.
- [ ] Audit log’un yönetici tarafından değiştirilememesini sağla.

## 12.2. Veri sürümü ekranı

- [ ] İçe aktarılan bütün dataset sürümlerini listele.
- [ ] Aktif production sürümünü açıkça göster.
- [ ] Her sürümün kaynak commit/hash bilgisini göster.
- [ ] Her sürümün sezon kapsamını göster.
- [ ] Oyuncu, kulüp, maç ve oyuncu–kulüp–sezon sayılarını göster.
- [ ] Veri kalite raporuna bağlantı ver.
- [ ] Kritik ve uyarı düzeyindeki sorunları ayır.
- [ ] Başarısız sürümün aktif edilmesini engelle.
- [ ] Sürüm aktivasyonunu iki adımlı onaya bağla.
- [ ] Önceki sürüme geri dönme prosedürünü ekle.
- [ ] Geri dönüşün geçmiş grid snapshot’larını etkilemediğini doğrula.

## 12.3. Kulüp ve oyuncu inceleme ekranı

- [ ] Canonical kulüp listesi oluştur.
- [ ] Kulüp alias’larını görüntüle ve düzenle.
- [ ] Kulüp şehir ve grup etiketlerini görüntüle.
- [ ] Dört Büyük etiketini yalnızca yetkili rolün değiştirmesini sağla.
- [ ] Oyuncu arama ekranı oluştur.
- [ ] Oyuncunun uyruk ve mevki bilgisini göster.
- [ ] Oyuncunun sezon sezon kulüplerini göster.
- [ ] Her ilişkinin kanıt kaynağını göster.
- [ ] Aynı isim şüphesi olan oyuncuları işaretle.
- [ ] Oyuncu birleştirme işlemini doğrudan silme yerine geri alınabilir override olarak tasarla.
- [ ] Manuel değişiklik için gerekçe ve kaynak bağlantısı zorunlu tut.

## 12.4. Kural yönetimi

- [ ] Kural tiplerini listele.
- [ ] Parametreli kural örneği oluşturmayı destekle.
- [ ] Kullanıcı başlığını önizle.
- [ ] Kuralın cevap sayısını göster.
- [ ] Cevap örneklerini göster.
- [ ] Veri kalite uyarılarını göster.
- [ ] Kuralı aktif veya pasif yap.
- [ ] Otomatik üretim havuzuna dahil edilip edilmediğini ayrı tut.
- [ ] Kural değişikliğinde üyelikleri yeniden hesaplat.
- [ ] Yeniden hesaplama bitmeden eski aktif üyelikleri koru.
- [ ] Kural silmek yerine arşivleme kullan.

## 12.5. Grid yönetimi

- [ ] Takvim görünümünde geçmiş ve gelecek gridleri göster.
- [ ] Otomatik grid adayları üretme butonu ekle.
- [ ] Adayların toplam kalite puanını göster.
- [ ] Dokuz hücrenin cevap sayısını ve zorluğunu göster.
- [ ] Her hücrenin örnek cevaplarını incelet.
- [ ] Kural tekrar uyarılarını göster.
- [ ] Grid üzerinde satır/sütun kurallarını değiştirmeyi destekle.
- [ ] Değişiklikten sonra bütün kesişimleri yeniden doğrula.
- [ ] Taslağı kaydet.
- [ ] Editör onayı iste.
- [ ] Onaydan sonra yayın tarihini planla.
- [ ] Yayınlanmış gridde doğrudan düzenlemeyi kapat.
- [ ] Acil revision iş akışı oluştur.
- [ ] Gridin public önizlemesini ayrı pencerede göster.

## 12.6. Veri sorunu yönetimi

- [ ] Kullanıcı bildirimlerini tarih ve durumla listele.
- [ ] Grid, hücre, oyuncu ve dataset version filtreleri ekle.
- [ ] `new`, `investigating`, `fixed`, `rejected` durumlarını tanımla.
- [ ] Aynı sorunla ilgili bildirimleri grupla.
- [ ] Sorunun ham kaynak kaydını göster.
- [ ] Düzeltilmesi gereken katmanı belirle: alias, ETL, referans veri, kural veya grid snapshot.
- [ ] Düzeltmenin gelecek dataset sürümüne mi acil revisona mı gireceğini seç.
- [ ] Red kararında iç gerekçe sakla.
- [ ] Düzeltme sonrası regresyon testi eklemeyi zorunlu kontrol maddesi yap.
- [ ] Bildirim kapanınca audit log kaydı oluştur.

## Faz 12 kabul kriterleri

- [ ] Editör ham veritabanına bağlanmadan grid hazırlayabiliyor.
- [ ] Veri sürümü, kural ve grid değişiklikleri izlenebiliyor.
- [ ] Yayınlanan içerik onay sürecinden geçiyor.
- [ ] Manuel veri düzeltmeleri kaynak ve gerekçeyle kaydediliyor.
- [ ] Yönetici yetkileri rol bazında sınırlandırılmış.

---

# FAZ 13 — Güvenlik, hile azaltma ve gizlilik

## 13.1. Uygulama güvenliği

- [ ] Veritabanı ve uygulama sırlarını kaynak koda yazma.
- [ ] Geliştirme, staging ve production sırlarını ayır.
- [ ] Production sırlarını hosting sağlayıcının secret yönetiminde tut.
- [ ] Veritabanı kullanıcısına yalnızca gereken yetkileri ver.
- [ ] Yönetim işlemleri için ayrı yetki değerlendirmesi yap.
- [ ] Bütün sorgularda parametreli sorgu veya güvenli ORM kullan.
- [ ] Kullanıcı metinlerini HTML olarak doğrudan render etme.
- [ ] XSS, CSRF, SQL injection ve yetki atlama testleri yaz.
- [ ] CORS’u yalnızca gerekli origin’lerle sınırla.
- [ ] Güvenlik header’larını etkinleştir.
- [ ] HTTPS’i zorunlu tut.
- [ ] Bağımlılık güvenlik taraması çalıştır.
- [ ] Kritik açıkta deploy’u durdurma politikası oluştur.

## 13.2. Cevap sızıntısını azaltma

- [ ] Geçerli cevap listelerini frontend bundle’a koyma.
- [ ] Cevap snapshot’larını public dosya depolamasında tutma.
- [ ] Arama endpoint’ini seçili hücreye göre filtreleme.
- [ ] Tahmin endpoint’inde yalnızca tek oyuncuyu doğrula.
- [ ] Hata mesajında hangi kriterin tutmadığını söyleme.
- [ ] API response sürelerinden toplu cevap kümesi çıkarılmasını zorlaştır.
- [ ] Grid yayınından önce cevap listesini hiçbir public endpoint’te açma.
- [ ] Yönetici önizleme endpoint’ini admin yetkisiyle koru.
- [ ] Sunucu loglarında tam cevap listelerini gereksiz yere yazma.
- [ ] Public source map politikasını gözden geçir.

## 13.3. Otomasyon ve scraping azaltma

- [ ] IP, session ve endpoint bazlı oran sınırları belirle.
- [ ] Arama ve tahmin endpoint’leri için farklı limitler kullan.
- [ ] Çok hızlı ardışık oyuncu denemelerini işaretle.
- [ ] Tek session’dan oyuncu listesinin taranmasını engelleyecek limit koy.
- [ ] Limit aşıldığında anlaşılır ama ayrıntı sızdırmayan hata döndür.
- [ ] Şüpheli trafiği gözlemleme paneline ekle.
- [ ] CDN/WAF desteğini değerlendirmeye al.
- [ ] CAPTCHA’yı ilk çözüm olarak koyma; yalnızca yoğun kötüye kullanımda devreye al.
- [ ] Arama motorlarının API endpoint’lerini indekslememesini sağla.
- [ ] Mutlak hile engelinin mümkün olmadığını ürün beklentisine yaz.

## 13.4. Oyun bütünlüğü

- [ ] Session durumunu yalnızca sunucuda yetkili kaynak olarak tut.
- [ ] İstemciden gelen dolu hücre bilgisine güvenme.
- [ ] Grid ID ve tarih manipülasyonunu doğrula.
- [ ] Eski gridde yeni session açma politikasını uygula.
- [ ] Aynı tahmin isteğinin tekrarlanmasının session durumunu veya istatistikleri bozmasını engelle.
- [ ] Tarayıcı saatine güvenme.
- [ ] Gün ve yayın durumunu sunucu saatinden belirle.
- [ ] Şüpheli tamamlanma sürelerini analiz için işaretle.
- [ ] Liderlik tablosu eklenene kadar ağır anti-cheat yatırımı yapma.

## 13.5. Gizlilik ve veri saklama

- [ ] Hangi kullanıcı verilerinin tutulduğunu envanterle.
- [ ] Hesapsız MVP’de e-posta veya ad toplamamayı tercih et.
- [ ] IP adreslerinin loglarda ne kadar süre tutulacağını belirle.
- [ ] Analitik event’lerini kişisel veriden arındır.
- [ ] Zorunlu çerez ve yerel depolama kullanımını belgeye yaz.
- [ ] Gereksiz üçüncü taraf izleme kodu ekleme.
- [ ] Gizlilik politikasını yayına hazırla.
- [ ] Veri silme ve saklama sürelerini tanımla.
- [ ] Yönetici audit log’u ile kullanıcı event saklamasını ayır.
- [ ] Yasal gereklilikleri launch öncesi güncel kaynaklardan kontrol et.

## Faz 13 kabul kriterleri

- [ ] Cevap listesi istemciye veya public depolamaya sızmıyor.
- [ ] Kritik endpoint’lerde oran sınırı var.
- [ ] Yönetim paneli güçlü kimlik doğrulamayla korunuyor.
- [ ] Uygulama temel web güvenlik testlerini geçiyor.
- [ ] Toplanan kullanıcı verisi ve saklama süresi belgelenmiş.

---

# FAZ 14 — Test ve kalite güvence

## 14.1. Test altyapısı

- [ ] Unit, integration, data ve E2E testlerini ayrı komutlarla çalıştır.
- [ ] Test veritabanını geliştirme veritabanından ayır.
- [ ] Deterministik test fixture’ları oluştur.
- [ ] Testlerin aynı sonuçla tekrar çalışmasını sağla.
- [ ] CI’da testleri otomatik çalıştır.
- [ ] Başarısız kritik testte merge/deploy’u durdur.
- [ ] Yavaş testleri etiketle.
- [ ] Test sonuçlarını CI artifact’i olarak sakla.

## 14.2. Veri pipeline testleri

- [ ] Kaynak sezon sayısının 14 olduğunu test et.
- [ ] Beklenen sezon kodlarının eksiksiz olduğunu test et.
- [ ] Her sezonun en az bir kulüp ve maç içerdiğini test et.
- [ ] Duplicate kaynak kimliklerini test et.
- [ ] Geçersiz tarih ve sezon ilişkisini test et.
- [ ] Ev sahibi ile deplasman kulübünün aynı olmadığını test et.
- [ ] Ödüllendirilmiş maçların oyuncu ilişkisi üretmediğini test et.
- [ ] 2012/13’te lineup varsayımı yapılmadığını test et.
- [ ] 2013/14 sonrası appearances ve lineup birleşimini test et.
- [ ] Transfer-only kaydın kabul edilmediğini test et.
- [ ] Alias normalizasyon testlerini çalıştır.
- [ ] Aynı oyuncunun yanlış birleşmesini yakalayan fixture kullan.
- [ ] Pozisyon mapping testlerini çalıştır.
- [ ] Uyruk mapping testlerini çalıştır.
- [ ] Kulüp şehir ve grup etiketlerini test et.
- [ ] Şampiyon tablosunun her sezon için tek kayıt içerdiğini test et.

## 14.3. Kural motoru testleri

- [ ] Her kural tipi için en az bir pozitif test yaz.
- [ ] Her kural tipi için en az bir negatif test yaz.
- [ ] Eksik veri sınır durumlarını test et.
- [ ] Sezon içi transfer oyuncusunu test et.
- [ ] Çoklu uyruk politikasını test et.
- [ ] Çoklu mevki politikasını test et.
- [ ] Takım arkadaşının kendisiyle eşleşmediğini test et.
- [ ] Takım arkadaşlığında aynı kulüp ama farklı sezonu reddet.
- [ ] Şampiyon kadro kuralını bütün sezonlarda test et.
- [ ] İstanbul ve Dört Büyük grup kesişimlerini test et.
- [ ] Minimum kulüp ve sezon eşik sınırlarını test et.
- [ ] Kural üyeliklerinin dataset version’a bağlı olduğunu test et.

## 14.4. Grid üretici testleri

- [ ] Sıfır cevaplı hücre içeren adayı reddettiğini test et.
- [ ] Minimumun altında cevaplı hücreyi reddettiğini test et.
- [ ] Tamamı zor satırı reddettiğini test et.
- [ ] Tamamı zor sütunu reddettiğini test et.
- [ ] Tekrarlanan kuralı reddettiğini test et.
- [ ] Yakın anlamlı kural uyarısını test et.
- [ ] Aynı seed’in aynı gridi ürettiğini test et.
- [ ] Farklı seed’lerin aday çeşitliliği ürettiğini test et.
- [ ] Deneme limiti sonunda kontrollü hata verdiğini test et.
- [ ] Cevap snapshot’ının sonradan değişmediğini test et.

## 14.5. API integration testleri

- [ ] Günlük grid endpoint’inin yalnızca yayınlanmış gridi döndürdüğünü test et.
- [ ] Cevapların payload’da bulunmadığını test et.
- [ ] Session açılışını test et.
- [ ] Doğru tahmini test et.
- [ ] Yanlış tahminin hücreyi açık ve session’ı aktif bıraktığını test et.
- [ ] Dolu hücreye ikinci tahmini reddet.
- [ ] Aynı oyuncunun ikinci kullanımını reddet.
- [ ] Yanlış grid/session kombinasyonunu reddet.
- [ ] Bitmiş oyuna tahmini reddet.
- [ ] Tekrarlanan idempotent isteği test et.
- [ ] Eşzamanlı istek yarışını test et.
- [ ] Arama normalizasyonunu test et.
- [ ] Oran sınırını test et.
- [ ] Yetkisiz admin isteğini reddet.

## 14.6. Uçtan uca oyun testleri

- [ ] Kullanıcının günlük gridi açmasını test et.
- [ ] Hücre seçmesini test et.
- [ ] Oyuncu aramasını test et.
- [ ] Doğru cevapla hücrenin kilitlenmesini test et.
- [ ] Arka arkaya yanlış cevapların oyunu bitirmediğini test et.
- [ ] Sayfa yenilemesinde durumun korunmasını test et.
- [ ] Dokuz hücre tamamlanınca kazanma ekranını test et.
- [ ] Oyunda kaybetme durumunun oluşmadığını test et.
- [ ] Paylaşım metninin cevap içermediğini test et.
- [ ] Mobil viewport’ta tam oyun akışını test et.
- [ ] Klavye ile tam oyun akışını test et.
- [ ] Yavaş ağ ve geçici API hatasını test et.
- [ ] Gün değişimi sırasında açık oyunu test et.

## 14.7. Performans ve yük testleri

- [ ] Günlük grid endpoint’i için hedef yanıt süresi belirle.
- [ ] Oyuncu araması için hedef yanıt süresi belirle.
- [ ] Tahmin doğrulaması için hedef yanıt süresi belirle.
- [ ] Beklenen günlük eşzamanlı kullanıcı tahminini yaz.
- [ ] En az beklenen pik yükün iki katıyla test yap.
- [ ] Veritabanı bağlantı havuzunu yük altında test et.
- [ ] Arama indekslerinin tam tablo taraması yapmadığını doğrula.
- [ ] Tahmin transaction’ında kilit bekleme sürelerini ölç.
- [ ] Grid yayın anında cache yenilenmesini test et.
- [ ] Yük testinin production cevap verisini açığa çıkarmadığından emin ol.

## 14.8. Görsel, tarayıcı ve erişilebilirlik QA

- [ ] Güncel Chrome, Safari, Firefox ve Edge’de test et.
- [ ] iOS Safari ve Android Chrome’da test et.
- [ ] Küçük, orta ve büyük telefon ekranlarında test et.
- [ ] Uzun oyuncu ve kulüp adlarını test et.
- [ ] Türkçe karakterleri test et.
- [ ] Koyu mod varsa bütün durumları test et.
- [ ] Otomatik erişilebilirlik taraması çalıştır.
- [ ] Manuel klavye testi yap.
- [ ] Ekran okuyucuyla temel akışı test et.
- [ ] Kontrast ve yakınlaştırma testlerini tamamla.

## 14.9. Yedek ve geri yükleme testi

- [ ] Veritabanı yedeğini test ortamına geri yükle.
- [ ] Geri yüklenen verinin satır sayılarını doğrula.
- [ ] Grid snapshot’larının geri geldiğini doğrula.
- [ ] Yönetici audit log’larının geri geldiğini doğrula.
- [ ] Yedekten sonra uygulamanın günlük gridi açabildiğini doğrula.
- [ ] Restore süresini ölç ve runbook’a yaz.
- [ ] En az üç ayda bir geri yükleme tatbikatı planla.

## Faz 14 kabul kriterleri

- [ ] Veri, kural, grid ve API kritik testlerinin tamamı CI’da geçiyor.
- [ ] Tam oyun akışı masaüstü ve mobilde test edilmiş.
- [ ] Pik yük hedefi karşılanıyor.
- [ ] Erişilebilirlikte kritik hata yok.
- [ ] Production benzeri bir yedek başarıyla geri yüklenmiş.

---

# FAZ 15 — Hosting, veritabanı saklama ve deployment

## 15.1. Ortam yapısı

- [ ] `development`, `staging` ve `production` ortamlarını ayır.
- [ ] Her ortam için ayrı PostgreSQL veritabanı kullan.
- [ ] Production verisini geliştirme ortamına doğrudan kopyalama.
- [ ] Ortam değişkenlerini belgeleyen örnek dosya oluştur.
- [ ] Gerçek sırları örnek dosyaya koyma.
- [ ] Ortamların hangi branch/commit’ten deploy olduğunu kaydet.
- [ ] Staging’i production yapılandırmasına mümkün olduğunca benzet.

## 15.2. PostgreSQL sağlayıcısı seçimi

- [ ] Ücretsiz veya düşük maliyetli yönetilen PostgreSQL seçeneklerini güncel olarak araştır.
- [ ] Ücretsiz kotanın depolama sınırını karşılaştır.
- [ ] Bağlantı ve eşzamanlılık sınırlarını karşılaştır.
- [ ] Otomatik yedek ve point-in-time recovery seçeneklerini karşılaştır.
- [ ] Veritabanının uygulamaya coğrafi yakınlığını karşılaştır.
- [ ] Uykuya geçme/soğuk başlangıç davranışını karşılaştır.
- [ ] Dışa aktarma ve sağlayıcı değiştirme kolaylığını karşılaştır.
- [ ] Ücretli API almadan yalnızca altyapı maliyetini planla.
- [ ] Sağlayıcı kilitlenmesini azaltmak için standart PostgreSQL özelliklerinde kal.
- [ ] Seçimi bir karar kaydıyla belgeye yaz.

## 15.3. Production veri yerleşimi

- [ ] Canonical oyun verisini PostgreSQL’de sakla.
- [ ] Uygulamanın ham CSV/JSON dosyalarından doğrudan cevap vermesini engelle.
- [ ] Ham dcaribou snapshot’larını private object storage veya erişimi kapalı build artifact olarak sakla.
- [ ] Ham veriyi public web klasörüne koyma.
- [ ] ETL çıktılarını dataset version ile sakla.
- [ ] Cevap snapshot’larını PostgreSQL’de private tabloda sakla.
- [ ] Arama için gerekli indeksleri production migration’ına ekle.
- [ ] Büyük ara tabloların boyutunu ölç.
- [ ] Gereksiz ham alanları production veritabanına taşımama kararı ver.
- [ ] Veritabanı boyutu için yüzde 30 büyüme payı bırak.

## 15.4. Migration ve seed akışı

- [ ] Migration’ları version control’de tut.
- [ ] Her deploy’dan önce migration planını staging’de çalıştır.
- [ ] Migration yedeği/geri dönüş yolunu belirle.
- [ ] Production migration’ını tek kontrollü iş olarak çalıştır.
- [ ] Aynı migration’ın iki kez çalıştırılmasını engelle.
- [ ] Referans verileri idempotent seed ile yükle.
- [ ] Demo/test verisini production seed’ine koyma.
- [ ] Migration sonrası health check çalıştır.
- [ ] Başarısız migration’da yeni uygulama sürümünü trafik almadan durdur.

## 15.5. Uygulama deployment’ı

- [ ] Frontend/backend hosting modelini seç.
- [ ] Tek uygulama veya ayrı servis kararını yük ve sadeliğe göre ver.
- [ ] Build komutlarını sabitle.
- [ ] Production build’ini CI’da üret.
- [ ] Commit hash’ini uygulama sürümüne ekle.
- [ ] Staging deploy’unu otomatikleştir.
- [ ] Production deploy’una manuel onay koy.
- [ ] Deploy sonrası smoke test çalıştır.
- [ ] Başarısız smoke testte önceki sürüme geri dön.
- [ ] Domain ve DNS ayarlarını yap.
- [ ] TLS sertifikası ve otomatik yenilemeyi doğrula.

## 15.6. Cache ve bağlantı yönetimi

- [ ] Günlük grid gibi değişmeyen public cevaplara kısa/uygun cache uygula.
- [ ] Tahmin ve session cevaplarını private/no-store yap.
- [ ] Gün değişiminde cache invalidation stratejisini test et.
- [ ] PostgreSQL bağlantı havuzu kullan.
- [ ] Serverless hosting seçilirse connection pooler kullan.
- [ ] Maksimum bağlantı sayısını sağlayıcı kotasına göre ayarla.
- [ ] Uzun süren sorgular için timeout belirle.
- [ ] Tekrarlanan kural sonuçlarını uygulama cache’inde tutmanın gerekliliğini ölç.
- [ ] Cache yokken de verinin doğru kalmasını sağla.

## 15.7. Yedekleme ve felaket kurtarma

- [ ] Günlük otomatik PostgreSQL yedeği aç.
- [ ] Yedek saklama süresini belirle.
- [ ] Dataset raw snapshot’larını ayrı yedekle.
- [ ] Şampiyon, kulüp etiketi ve alias gibi manuel verileri yedeğe dahil et.
- [ ] Grid ve cevap snapshot’larını yedeğe dahil et.
- [ ] Yedeklerin şifreli tutulduğunu doğrula.
- [ ] Restore yetkisini sınırlı kişilere ver.
- [ ] RPO ve RTO hedeflerini yaz.
- [ ] Felaket kurtarma adımlarını runbook olarak oluştur.
- [ ] Yedek başarısızlığında uyarı gönder.

## 15.8. Gözlemleme

- [ ] Uygulama hata izleme sistemi kur.
- [ ] API yanıt süresi metriklerini topla.
- [ ] HTTP hata oranlarını topla.
- [ ] Veritabanı bağlantı ve sorgu sürelerini izle.
- [ ] Günlük grid yayın başarısını izle.
- [ ] Dataset import başarısını izle.
- [ ] Oran sınırı ve şüpheli trafik olaylarını izle.
- [ ] Hassas verileri loglardan maskele.
- [ ] Log saklama süresini belirle.
- [ ] Kritik hata uyarı kanalını belirle.
- [ ] Uyarıların test mesajını gönder.

## Faz 15 kabul kriterleri

- [ ] Production verisi private PostgreSQL’de saklanıyor.
- [ ] Ham dataset ve cevap listeleri public erişime kapalı.
- [ ] Staging ve production tamamen ayrı.
- [ ] Migration, deploy, rollback ve restore akışları test edilmiş.
- [ ] Günlük yedek ve kritik uyarılar çalışıyor.

---

# FAZ 16 — Staging, beta ve yayına çıkış

## 16.1. Staging hazırlığı

- [ ] Production’a yakın veri büyüklüğüyle staging kur.
- [ ] En az 14 günlük gelecekteki gridleri hazırla.
- [ ] Gece yarısı yayın işini staging’de hızlandırılmış saatle test et.
- [ ] Dataset version aktivasyonunu staging’de dene.
- [ ] Bir grid revision sürecini staging’de dene.
- [ ] Backup/restore tatbikatını tamamla.
- [ ] Yönetici rollerini gerçek akışla test et.
- [ ] Cevap sızıntısı için network trafiğini incele.

## 16.2. İçerik ve hukuki hazırlık

- [ ] Nasıl oynanır metnini son haline getir.
- [ ] Veri kapsamı ve bilinen sınırlamalar metnini son haline getir.
- [ ] Veri kaynağı atıf şartlarını lisansla karşılaştır.
- [ ] Kaynak atfını siteye ekle.
- [ ] Ticari kullanım veya yeniden dağıtım sınırlamalarını tekrar doğrula.
- [ ] Gizlilik politikasını güncel yasal gerekliliklerle kontrol et.
- [ ] Kullanım koşullarını hazırla.
- [ ] İletişim/veri sorunu bildirme kanalını yayınla.
- [ ] Marka ve alan adı çakışmasını kontrol et.
- [ ] Kulüp logosu ve oyuncu yüzü kullanılmadığını doğrula.

## 16.3. Kapalı beta

- [ ] Farklı futbol bilgi seviyelerinden beta kullanıcıları seç.
- [ ] En az 20–30 kullanıcıyla test hedefi koy.
- [ ] Kullanıcıların internetten bakma isteği duyduğu hücreleri sor.
- [ ] Aşırı kolay ve aşırı zor hücreleri sor.
- [ ] Kural metinlerinin anlaşılırlığını sor.
- [ ] Yanlış reddedilen doğru cevapları topla.
- [ ] Doğru kabul edilen şüpheli cevapları topla.
- [ ] Mobil kullanım sorunlarını topla.
- [ ] Tamamlama ve terk oranlarını ölç.
- [ ] Her kritik geri bildirimi issue olarak kaydet.
- [ ] Veri hatalarını launch öncesi düzelt.
- [ ] Zorluk eşiklerini beta sonucuna göre bir kez kalibre et.

## 16.4. Launch öncesi kontrol

- [ ] Production dataset version’ı sabitle.
- [ ] İlk 14 günlük gridleri editör onayından geçir.
- [ ] İlk 14 günlük gridlerin cevap snapshot’larını dondur.
- [ ] Kritik ve yüksek öncelikli bug bırakma.
- [ ] Performans testinin production yapılandırmasında geçtiğini doğrula.
- [ ] Güvenlik kontrol listesini tamamla.
- [ ] Erişilebilirlik kontrol listesini tamamla.
- [ ] Analytics ve hata izlemeyi doğrula.
- [ ] Yedek al ve restore edilebilirliğini doğrula.
- [ ] Rollback sürümünü hazır tut.
- [ ] Bakım ekranını hazır tut.
- [ ] Launch sorumlularını ve iletişim kanalını belirle.

## 16.5. Yayın günü

- [ ] Production migration’larını çalıştır.
- [ ] Referans ve canonical veriyi yükle.
- [ ] Aktif dataset version’ı doğrula.
- [ ] Günlük gridi yayınla.
- [ ] Public smoke test yap.
- [ ] Gerçek bir oyun session’ını baştan sona tamamla.
- [ ] Mobil cihazdan oyunu tamamla.
- [ ] Cevap endpoint’lerinin veri sızdırmadığını tekrar kontrol et.
- [ ] Hata oranı ve yanıt sürelerini izle.
- [ ] Veri sorunu bildirimlerini yakından takip et.
- [ ] Kritik sorun varsa rollback kriterini uygula.

## Faz 16 kabul kriterleri

- [ ] Beta kullanıcıları oyunu açıklama almadan tamamlayabiliyor.
- [ ] Kritik veri ve oyun akışı hatası açık değil.
- [ ] İlk 14 günlük içerik hazır ve doğrulanmış.
- [ ] Lisans atfı, gizlilik ve kullanım metinleri yayında.
- [ ] Rollback ve bakım senaryosu hazır.

---

# FAZ 17 — Yayın sonrası günlük ve dönemsel işletim

## 17.1. Günlük operasyon

- [ ] Bugünün gridinin zamanında yayınlandığını kontrol et.
- [ ] Yarının gridinin onaylı olduğunu kontrol et.
- [ ] Kritik hata ve API hata oranlarını kontrol et.
- [ ] Yeni veri sorunu bildirimlerini gözden geçir.
- [ ] Şüpheli trafik uyarılarını gözden geçir.
- [ ] Yanlış kabul/red şikâyetlerini önceliklendir.
- [ ] Acil düzeltme gerekiyorsa revision prosedürünü uygula.
- [ ] Günlük operasyon kontrolünü kayda geçir.

## 17.2. Haftalık içerik operasyonu

- [ ] En az yedi yeni grid adayı üret.
- [ ] Kural tekrar sıklığını kontrol et.
- [ ] Zorluk dağılımını kontrol et.
- [ ] Hücre başına tanınabilir cevapları editörle kontrol et.
- [ ] Gelecek yedi günü onayla ve planla.
- [ ] Önceki haftanın başarı oranlarını incele.
- [ ] İnternetten arama isteğini artırabilecek hücreleri işaretle.
- [ ] Çok kolay veya çok zor kural örneklerini geçici pasife al.

## 17.3. Dataset güncelleme operasyonu

- [ ] dcaribou kaynağındaki yeni commit/release’i kontrol et.
- [ ] Kaynak değişiklik notlarını incele.
- [ ] Yeni snapshot’ı immutable olarak indir.
- [ ] Kaynak checksum’ını doğrula.
- [ ] ETL’yi staging’de çalıştır.
- [ ] Önceki sürümle satır ve ilişki farklarını üret.
- [ ] Silinen oyuncu–kulüp–sezon ilişkilerini özellikle incele.
- [ ] Yeni duplicate ve alias sorunlarını incele.
- [ ] Bilinen oyuncu regresyon testlerini çalıştır.
- [ ] Bütün kural üyeliklerini yeniden hesapla.
- [ ] Kesişim cardinality farklarını raporla.
- [ ] Hazır gridleri yeni dataset’e otomatik taşımama kuralını koru.
- [ ] Yeni dataset yalnızca yeni gridlerde kullanılacak şekilde aktifleştir.
- [ ] Güncelleme tarihini ve kaynak commit’ini yayın notuna yaz.

## 17.4. Aylık ürün ve kalite incelemesi

- [ ] Oynanan oyun sayısını incele.
- [ ] Tamamlama ve terk oranlarını incele.
- [ ] Hücre başarı oranı dağılımını incele.
- [ ] Kural türlerine göre başarı oranını incele.
- [ ] Veri şikâyeti oranını incele.
- [ ] Arama başarısızlıklarını ve alias ihtiyacını incele.
- [ ] Zorluk eşiklerinin kalibrasyon ihtiyacını değerlendir.
- [ ] En sık kullanılan kuralları dengele.
- [ ] Kullanılmayan veya sorunlu kuralları pasife al.
- [ ] Veritabanı büyüklüğü ve hosting kotasını kontrol et.
- [ ] Maliyet tahminini güncelle.
- [ ] Bağımlılık güncellemelerini planla.

## 17.5. Olay müdahalesi

- [ ] “Bugünün gridi yok” olay prosedürünü yaz.
- [ ] “Yanlış cevap snapshot’ı” olay prosedürünü yaz.
- [ ] “Veritabanı erişilemiyor” olay prosedürünü yaz.
- [ ] “Cevap listesi sızdı” olay prosedürünü yaz.
- [ ] “Yönetici hesabı ele geçirildi” olay prosedürünü yaz.
- [ ] Her olay için etki, öncelik ve sorumlu belirle.
- [ ] Gerekirse bakım moduna geçme adımını yaz.
- [ ] Kullanıcı iletişim şablonunu hazırla.
- [ ] Olay sonrası kök neden analizi yap.
- [ ] Aynı olayın tekrarlanmasını engelleyen test veya kontrol ekle.

## Faz 17 kabul kriterleri

- [ ] En az yedi günlük onaylı grid tamponu sürekli korunuyor.
- [ ] Dataset güncellemesi önce staging’de doğrulanıyor.
- [ ] Veri sorunları takip edilip sonuçlandırılıyor.
- [ ] Zorluk dengesi gerçek oyun sonuçlarıyla düzenli inceleniyor.
- [ ] Kritik olaylar için yazılı müdahale prosedürü var.

---

# MVP dışı backlog

Bu maddeler ilk çalışan sürümü geciktirmemeli.

## Veri kapsamı genişletmeleri

- [ ] 2000/01–2011/12 sezonları için ayrı kaynak araştırması yap.
- [ ] TFF arşivlerinden geçmiş sezon kadrolarını yasal ve teknik olarak doğrula.
- [ ] Yeni kaynak ile dcaribou oyuncu/kulüp kimliklerini eşle.
- [ ] Kaynaklar çelişince öncelik kuralı tanımla.
- [ ] Eski sezonları ana ürüne almadan ayrı beta dataset’inde test et.
- [ ] Maçta oynama dakikası veya başlangıç/yedek ayrımını eklemeyi değerlendir.
- [ ] Kesin tarih çakışmalı takım arkadaşlığı sürümünü değerlendirmeye al.

## Yeni kural türleri

- [ ] Ayrıntılı mevki kuralları ekle: stoper, bek, kanat, merkez orta saha.
- [ ] Belirli iki kulüpte de oynadı kuralını değerlendir.
- [ ] Birden fazla şampiyonluk yaşadı kuralını değerlendir.
- [ ] En az belirli sayıda Dört Büyük kulübünde oynadı kuralını değerlendir.
- [ ] Aynı sezonda iki Süper Lig kulübünde oynadı kuralını değerlendir.
- [ ] Doğum ülkesi ile milli takım uyruğunu ayırmayı değerlendir.
- [ ] Yaş/doğum yılı aralığı kuralını yalnızca veri doluluğu yeterliyse ekle.
- [ ] Avrupa kupası veya milli takım kurallarını yeni güvenilir kaynak bulunmadan ekleme.
- [ ] Gol, asist ve kart kurallarını tam ve doğrulanabilir veri olmadan ekleme.

## Görsel içerik

- [ ] Kulüp logoları için kullanım izinlerini tek tek araştır.
- [ ] Lisans uygun değilse metin/renk/baş harf tabanlı kulüp kimliği kullan.
- [ ] Oyuncu yüzleri için lisanslı kaynak araştır.
- [ ] Hotlink yapmama ve silme taleplerini karşılama politikasını oluştur.
- [ ] Görselleri CDN’de saklama ve boyutlandırma pipeline’ı kur.
- [ ] Görsel olmayan fallback tasarla.

## Sosyal ve hesap özellikleri

- [ ] Kullanıcı hesabı ekle.
- [ ] E-posta doğrulama ve parola sıfırlama ekle.
- [ ] Cihazlar arası istatistik senkronizasyonu ekle.
- [ ] Seri, başarı rozeti ve kişisel geçmiş ekle.
- [ ] Liderlik tablosu eklenirse güçlü anti-cheat tasarla.
- [ ] Arkadaşlarla özel grid paylaşımını değerlendir.
- [ ] Haftalık özel grid modunu değerlendir.
- [ ] 4×4 veya tematik gridleri ana 3×3 deneyimden ayrı test et.

---

# Kritik yol ve bağımlılıklar

```text
Ürün tanımları
    ↓
Kaynak snapshot + lisans kaydı
    ↓
Canonical veri modeli + ETL
    ↓
Manuel referans verileri + veri kalite kapısı
    ↓
Kural motoru + cevap kümeleri
    ↓
Grid üreticisi + zorluk denetimi
    ↓
Günlük grid snapshot’ı
    ↓
Backend API + oyun session’ı
    ↓
Web arayüzü
    ↓
Test + güvenlik + performans
    ↓
Staging + beta
    ↓
Production yayını + sürekli operasyon
```

- [ ] Veri kalite kapısı geçmeden kural motorunu production verisi sayma.
- [ ] Kural üyelikleri doğrulanmadan grid üretimine başlama.
- [ ] Grid snapshot modeli tamamlanmadan public API’yi sabitleme.
- [ ] API cevap sızıntısı testleri geçmeden beta açma.
- [ ] En az 14 günlük grid stoğu olmadan public launch yapma.
- [ ] Restore testi geçmeden production launch yapma.

---

# Önerilen çalışma sırası — ilk 60 somut iş

Bu sıra ekip tek kişi olsa bile uygulanabilir. Her satır ayrı bir iş kartına çevrilebilir.

1. [x] MVP ürün kararlarını `docs/PRODUCT_DECISIONS.md` dosyasına yaz.
2. [x] Takım arkadaşlığı tanımını kesinleştir.
3. [x] 2012/13 özel kapsam metnini kesinleştir.
4. [ ] Uyruk ve çoklu uyruk politikasını kesinleştir.
5. [ ] Mevki mapping politikasını kesinleştir.
6. [x] İstanbul dışı/Anadolu terimini kesinleştir.
7. [x] Yanlış tahmin hakkını sınırsız olarak belirle.
8. [x] Rarity’nin launch kapsamını belirle: beta sonrasına bırak.
9. [ ] Git deposu ve branch kurallarını hazırla.
10. [x] Uygulama, ETL ve ortak paket klasörlerini oluştur.
11. [x] Yerel PostgreSQL geliştirme ortamını kur.
12. [x] Test veritabanını kur.
13. [x] Ortam değişkeni örnek dosyasını oluştur.
14. [x] dcaribou lisansını ve atıf metnini arşivle.
15. [x] 2012/13–2025/26 raw snapshot’ını indir.
16. [x] Snapshot checksum ve kaynak commit bilgisini kaydet.
17. [x] Kaynak dosya envanterini çıkar.
18. [x] Her sezonun alan ve doluluk profilini üret.
19. [ ] PostgreSQL temel tablolarının migration’ını yaz.
20. [ ] Canonical kulüp ve alias tablolarını oluştur.
21. [ ] Canonical oyuncu ve alias tablolarını oluştur.
22. [ ] Sezon ve maç tablolarını oluştur.
23. [ ] Oyuncu–kulüp–sezon kanıt tablolarını oluştur.
24. [ ] Dataset version ve import run tablolarını oluştur.
25. [ ] Raw dosya doğrulama adımını yaz.
26. [ ] Sezon normalizasyonunu yaz.
27. [ ] Kulüp normalizasyonunu yaz.
28. [ ] Oyuncu kimlik eşlemesini yaz.
29. [ ] Uyruk normalizasyonunu yaz.
30. [ ] Mevki mapping’ini yaz.
31. [ ] Appearances kaynak ilişkilerini yükle.
32. [ ] 2013/14 sonrası lineup kaynak ilişkilerini yükle.
33. [ ] 2012/13 lineup eksikliği kuralını uygula.
34. [ ] Ödüllendirilmiş maçları işaretle ve oyuncu ilişkisi üretme.
35. [ ] Kaynak kanıtlarını tekilleştirerek `player_season_club` üret.
36. [ ] Kulüp şehir ve grup etiketlerini manuel doğrula.
37. [ ] 14 sezonun şampiyon tablosunu resmi kaynaklarla doldur.
38. [ ] Bilinen oyuncu regresyon fixture’ını oluştur.
39. [ ] İlk tam veri kalite raporunu üret.
40. [ ] Kritik veri hatalarını düzelt ve dataset v1’i dondur.
41. [ ] Ortak kural sözleşmesini uygula.
42. [ ] Kulüp, uyruk, kıta ve mevki kurallarını uygula.
43. [ ] Takım arkadaşlığı kuralını uygula.
44. [ ] Şampiyon kadro ve kulüp grubu kurallarını uygula.
45. [ ] Kulüp/sezon sayısı ve dönem kurallarını uygula.
46. [ ] Kural üyeliklerini önceden hesapla.
47. [ ] Kural kesişim önbelleğini üret.
48. [ ] Minimum cevap eşiği ve ilk zorluk sınıflarını uygula.
49. [ ] Deterministik grid üreticisini yaz.
50. [ ] Grid kompozisyon doğrulamalarını yaz.
51. [ ] Grid ve cevap snapshot tablolarını oluştur.
52. [ ] Yönetici grid önizlemesinin ilk sürümünü hazırla.
53. [ ] Günlük grid/session/arama/tahmin API’lerini tamamla.
54. [ ] 3×3 web arayüzü ve arama akışını tamamla.
55. [ ] Sonuç/paylaşım ve yardım ekranlarını tamamla.
56. [ ] Kritik unit, integration ve E2E testlerini tamamla.
57. [ ] Hosting ve yönetilen PostgreSQL sağlayıcısını seç.
58. [ ] Staging deploy, migration ve restore testini tamamla.
59. [ ] Kapalı beta yap ve zorluk eşiklerini kalibre et.
60. [ ] İlk 14 gridle production launch kontrol listesini tamamla.

---

# MVP için kesin “bitti” tanımı

MVP ancak aşağıdaki maddelerin tamamı işaretlendiğinde tamamlanmış sayılmalı:

- [ ] Veri yalnızca 2012/13–2025/26 Süper Lig sezonlarını kapsıyor.
- [ ] Aktif dataset dcaribou kaynak commit’i ve checksum’ıyla yeniden üretilebiliyor.
- [ ] 2012/13 kapsam sınırlaması kullanıcıya açıkça anlatılıyor.
- [ ] Oyuncu adı, uyruk, ana mevki ve sezonluk kulüp ilişkileri çalışıyor.
- [ ] Takım arkadaşlığı aynı kulüp–sezon üzerinden çalışıyor.
- [ ] Şampiyon kadro, İstanbul dışı ve Dört Büyük kuralları çalışıyor.
- [ ] Transfer-only kayıtlar cevap kabul edilmiyor.
- [ ] Ödüllendirilmiş maçlardan oyuncu ilişkisi üretilmiyor.
- [ ] Her günlük gridin dokuz hücresinde minimum sekiz cevap var.
- [ ] Hiçbir satır veya sütunun tamamı zor değil.
- [ ] Editör grid cevaplarını ve zorluğunu yayın öncesi görebiliyor.
- [ ] Yayınlanmış grid cevapları dataset güncellemesinden etkilenmiyor.
- [ ] Doğru cevap kontrolü yalnızca sunucuda yapılıyor.
- [ ] Cevap listeleri istemciye veya public depolamaya gönderilmiyor.
- [ ] Oyun mobil ve masaüstünde tamamlanabiliyor.
- [ ] Yenileme sonrası oyun durumu korunuyor.
- [ ] Yanlış tahminlerin sınırsız olması, dolu hücre kilidi ve oyuncu tekrar kuralları doğru çalışıyor.
- [ ] Veri hatası bildirme akışı çalışıyor.
- [ ] Kritik veri, güvenlik, API ve E2E testleri geçiyor.
- [ ] Production PostgreSQL yedeklemesi ve test restore’u tamamlanmış.
- [ ] En az 14 günlük onaylı grid hazır.
- [ ] Veri lisansı/atfı, gizlilik ve kullanım metinleri yayında.
- [ ] Hata izleme, yayın kontrolü ve acil rollback prosedürü çalışıyor.

---

# Son notlar

- İlk sürümde en büyük risk tasarım değil, yanlış oyuncu–kulüp–sezon ilişkisidir. Veri kalite kapısı atlanmamalı.
- “Cevap sayısı yeterli” tek başına adil hücre anlamına gelmez. Editör tanınırlık kontrolü launch döneminde zorunlu kalmalı.
- 2012/13 ile sonraki sezonların kanıt kalitesi aynı değildir; bu fark hem veri raporunda hem kullanıcı yardımında görünür olmalı.
- Yeni veri sürümleri geçmiş gridleri değiştirmemeli. Her grid kendi cevap snapshot’ıyla yaşamaya devam etmeli.
- Ham dataset, canonical veritabanı ve günlük cevap snapshot’ları birbirinden ayrı katmanlar olarak tutulmalı.
- Ücretli spor API’si olmadan MVP mümkündür; asıl düzenli maliyet hosting, yönetilen PostgreSQL ve olası depolama olacaktır.
