# 90+9 — MVP Ürün Kararları

> Durum: Onaylandı
> Son güncelleme: 12 Ağustos 2026

## Ürün tanımı

**90+9, Türkiye Süper Lig oyuncularını tahmin ederek her gün tamamladığın 3×3 günlük grid oyunudur.**

Kullanıcıya görünen marka adı `90+9`, teknik proje ve depo adı `90plus9` olacaktır.

## MVP kapsamı

- Oyun, Türkiye erkekler Süper Ligine odaklanır.
- Veri kapsamı 2012/13–2025/26 sezonlarıdır.
- MVP, hesap gerektirmeyen responsive bir web uygulamasıdır.
- Oyuncu fotoğrafları, kulüp logoları, gol, asist, kart, piyasa değeri, forma numarası, kaptanlık, millî takım maç sayısı, Türkiye Kupası, Avrupa kupaları, 2000/01–2011/12 sezonları, yerel mobil uygulama ve gerçek zamanlı çok oyunculu mod MVP dışındadır.

## Oyun akışı

- Günlük oyun üç satır ve üç sütundan oluşan dokuz hücrelik bir griddir.
- Kullanıcı seçtiği hücrenin iki kriterini de karşılayan bir oyuncu tahmin eder.
- Takım, mevki, uyruk ve şampiyonluk kriterleri satır veya sütunlara serbestçe yerleşebilir;
  kriter türlerine göre sabit eksen ayrımı yoktur.
- Günlük üretici kriterleri İstanbul tarihinden türetilen deterministik bir tohumla karıştırır.
  Dokuz hücrenin tamamı minimum cevap eşiğini karşılamayan yerleşimler elenir; bunun dışında
  takım/özellik dağılımına ilişkin zorunlu bir kompozisyon şablonu uygulanmaz.
- Kriter havuzu tam 100 öğeden oluşur: 35 takım, 13 mevki, 25 uyruk, 6 bölgesel uyruk grubu,
  6 kulüp/başarı grubu, 6 kariyer eşiği ve 9 yıldız oyuncuyla takım arkadaşlığı kriteri.
- Belirli sezon, yaş, boy ve ayak tercihi kriterleri bu havuzda bulunmaz.
- Bir grid yalnızca her hücresinde en az sekiz cevap varsa ve dokuz hücre dokuz farklı oyuncuyla
  tamamlanabiliyorsa yayınlanır.
- Biri diğerini tamamen kapsayan iki kriter aynı hücrede kesiştirilmez; iki kriterin de cevabı
  gerçekten daraltması sağlanır.
- Çözülebilir adaylar arasında yakın geçmişte daha az kullanılan kriterler tercih edilir; böylece
  sabit kategori kotası koymadan günler arası tekrar azaltılır.
- Yanlış tahmin hakkı sınırsızdır.
- Yanlış tahmin hücreyi kilitlemez, oyunu bitirmez ve herhangi bir hak tüketmez.
- Oyun için toplam tahmin hakkı veya hücre başına tahmin sınırı yoktur.
- Her günlük gridde tek joker hakkı vardır. Joker seçilen hücre için karışık sırada bir doğru ve
  beş yanlış oyuncu gösterir; kullanıldığı oturuma kaydedilir ve sayfa yenilendiğinde geri gelmez.
  Joker seçeneklerindeki doğru oyuncuyla doldurulan hücre ana gridde, sonuç PNG'sinde ve X paylaşım
  metninde koyu renkle işaretlenir. Hücre daha sonra joker dışındaki başka bir doğru oyuncuyla
  değiştirilirse işaret kalkar.
- Oyun zaman sınırlı değildir.
- Oyun yalnızca dokuz hücrenin tamamı doğru cevaplarla doldurulduğunda tamamlanır; kaybetme durumu yoktur.
- Dolu hücre, dokuzuncu doğru cevap girilene kadar yeniden açılabilir ve başka bir geçerli oyuncuyla değiştirilebilir.
- Dokuz hücre tamamlandığında oyun kesinleşir; hücreler kilitlenir ve artık değiştirilemez.
- Sonuç ekranı oyuncu adlarını gösteren bir PNG kartı, kopyalanabilir günlük grid bağlantısı ve sosyal paylaşım seçenekleri sunar. X paylaşım metni cevapları açıklamayan 3×3 turuncu kare biçimini korur.
- Yalnızca doğru yerleştirilmiş oyuncu kullanılmış sayılır ve aynı gridde ikinci bir hücrede kullanılamaz. Yanlış tahmin edilen oyuncu başka bir hücrede denenebilir.
- Kullanıcı hesabı zorunlu değildir. Oyun durumu, tahmin edilemeyen bir kimlikle anonim sunucu oturumunda tutulur.
- Navbar'daki istatistik paneli bu tarayıcıdaki mevcut seriyi, en uzun seriyi, tamamlanan grid
  sayısını ve son oynanan günleri gösterir. Hesap olmadığı için cihazlar arası senkronizasyon
  yapılmaz.
- Sayfa yenilemek doldurulmuş hücreleri veya oyun durumunu sıfırlamaz.
- Aynı İstanbul takvim gününde bütün kullanıcılar aynı gridi görür; yeni günde yeni grid açılır.
- Navbar'daki tarih seçici güncel tarihi gösterir; açıldığında yayınlanmış geçmiş gridler listelenir.
  Her günün ilerlemesi ayrı tutulur. İlk geçmiş grid 1 Ağustos 2026 tarihidir.
- Sınırsız oyun hakkı, otomasyon veya veri kazımasına sınırsız API isteği izni vermez; teknik oran sınırlamaları uygulanır.

## Geçerli cevap

- Oyuncunun ilgili kulüp ve sezonda sahaya çıkması (`appearance`) güçlü kanıttır.
- Oyuncunun resmî maçta ilk 11 listesinde (`starting_lineup`) veya yedek listesinde (`substitutes`) bulunması yeterli kanıttır.
- Transfer kaydı tek başına (`transfer_only`) geçerli ilişki oluşturmaz.
- Hükmen sonuçlanan ve oynanmayan maçlardan oyuncu ilişkisi üretilmez.
- 2012/13 sezonunda kadro listesi bulunmadığı için yalnızca sahaya çıkan oyuncular kapsanır.
- Bir oyuncu aynı sezonda iki Süper Lig kulübü için yeterli kanıta sahipse iki kulüp için de geçerlidir.

## Snapshot dışlamaları

- Ham snapshot arşivi ve CSV dosyaları değiştirilemez; silme kararları yalnızca türetilmiş ve
  canonical uygulama verisine uygulanır.
- `v677` snapshot'ındaki oyuncu kanıtı olmayan 29 maç uygulama importundan çıkarılır; bu karar
  maçların resmî durumunu sınıflandırmaz.
- Kaynak oyuncu profili olmayan dört oyuncu ve bu oyuncuların 22 lineup kanıt satırı uygulama
  importundan çıkarılır.
- Dışlamalar snapshot sürümüne bağlı kaynak kimlikleriyle
  [`data/reference/exclusions`](../data/reference/exclusions) altında tutulur ve importtan önce
  uygulanır.
- `v677` için kabul edilen regresyon taban çizgisi 4.589 maç, 3.770 oyuncu, 170.882 lineup satırı
  ve 9.343 oyuncu–kulüp–sezon ilişkisidir.

## Takım arkadaşlığı

- Takım arkadaşlığı aynı `club_id` ve aynı `season` değerine sahip olmak demektir.
- Oyuncuların aynı maçta bulunması veya sezon içindeki zaman aralıklarının örtüşmesi aranmaz.
- Bu nedenle devre arasında birbirini kaçıran iki oyuncu aynı kulüp–sezon verisinde yer alıyorsa eşleşebilir. Bu, MVP'nin bilinen sınırlamasıdır.
- Kullanıcıya görünen açıklama: “Aynı sezonda aynı kulüp kadro verisinde yer aldı.”
- Daha sıkı zaman örtüşmesi kontrolü MVP sonrası için backlog'dadır.

## Şampiyonluk

- `champion_squad_member`, şampiyon kulübün ilgili sezondaki resmî maç kadrolarından en az birinde yer alan oyuncuyu ifade eder.
- `champion_with_appearance`, şampiyon kulüp adına ilgili sezonda sahaya çıkan oyuncuyu ifade eder.
- MVP kriteri `champion_squad_member` kullanır.
- Kullanıcıya görünen kriter: “Şampiyon takım kadrosunda yer aldı.”
- Sezon içinde şampiyon kulüpten ayrılan oyuncu, ayrılmadan önce yeterli kadro kanıtı varsa bu kriteri karşılar.
- 2012/13–2025/26 şampiyonları sezon bazında resmî TFF arşiv URL'leriyle doğrulanır ve canonical
  kulüp kimliklerine bağlanır.

## Kulüp grupları

- İstanbul kulübü, merkez şehri İstanbul olan kulüptür.
- İstanbul dışı kulüp, merkez şehri İstanbul olmayan kulüptür.
- Kullanıcı arayüzünde “Anadolu takımı” ifadesi kullanılırsa bunun İstanbul dışı kulüp anlamına geldiği açıklanır; Ankara ve İzmir kulüpleri de bu gruptadır.
- Dört Büyükler Beşiktaş, Fenerbahçe, Galatasaray ve Trabzonspor'dur.
- Kurallar kulüp adlarıyla değil, veri içe aktarımı sırasında doğrulanacak sabit canonical kulüp kimlikleriyle uygulanır.

## Puanlama ve rarity

- MVP'de temel ilerleme ölçüsü doğru doldurulan hücre sayısıdır.
- Rarity puanı ilk yayında bulunmaz; beta sonrasına bırakılmıştır.
- Rarity eklendiğinde canlı kullanıcıların doğru cevaplarından üretilecek; minimum örnek sayısı, bot filtreleme ve yinelenen istek politikası özellik geliştirilmeden önce ayrıca kararlaştırılacaktır.
