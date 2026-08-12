# API belgeleri

Oyun endpoint’leri özel önbellek politikasıyla çalışır ve hiçbir endpoint geçerli cevap listesini
istemciye göndermez. Anonim oyun oturumu, `HttpOnly` ve `SameSite=Lax` özellikli
`plus9_session` cookie’siyle tanınır. Günlük oturumları aynı anonim cihaza bağlayan
`plus9_device` cookie’si seri ve tamamlanma istatistiklerinin gridler arasında korunmasını sağlar.

## `GET /api/v1/game`

İstanbul takvim günündeki yayınlanmış gridi ve mevcut anonim oturumun durumunu döndürür. Bugünün
gridi henüz yoksa güvenli biçimde üretip cevap anlık görüntüsünü dondurur. Cevapta satır/sütun
başlıkları, hücre cevap sayıları, doldurulmuş hücreler, ilerleme, tamamlanma durumu ve cihaz bazlı
istatistik özeti bulunur. Yanıttaki `joker` alanı günlük hakkın kullanılabilirliğini ve kullanıldıysa
aynı hücrede yeniden gösterilecek altı oyuncuyu taşır. Özet; mevcut seri, en uzun seri, tamamlanan
grid sayısı ve son yedi oyun gününü içerir.

`date=YYYY-MM-DD` parametresi yayınlanmış geçmiş bir gridi seçer. Cevaptaki `availableGrids` alanı
tarih seçicide gösterilecek günleri, grid numaralarını ve cihazın tamamlama durumunu döndürür.

## `GET /api/v1/players/search?q=`

En az iki karakterlik oyuncu adı sorgusunu canonical ad ve alias kayıtlarında arar. Türkçe
karakterlerin İngilizce klavye karşılıklarını kabul eder ve en fazla on sonuç döndürür.

## `POST /api/v1/guesses`

İstek gövdesi `cellKey`, `playerId` ve UUID biçiminde `requestId` alanlarını alır. Oturum ve grid
sunucuda doğrulanır; oyuncu yalnızca dondurulmuş hücre cevaplarında varsa kabul edilir. Aynı
`requestId` ile tekrarlanan istek aynı sonucu döndürür. Yanlış tahmin hak tüketmez, doğru tahmin
hücreyi doldurur veya mevcut doğru cevabı değiştirir.

Tanımlı istemci hata kodları arasında `INVALID_REQUEST`, `SESSION_NOT_FOUND`, `INVALID_CELL`,
`PLAYER_NOT_FOUND` ve `PLAYER_ALREADY_USED` bulunur.
Tamamlanmış oturumda yeni bir tahmin `GAME_COMPLETED` ile reddedilir; daha önce işlenmiş aynı
`requestId` ise idempotent biçimde eski sonucunu döndürür.

## `POST /api/v1/joker`

İstek gövdesinde `cellKey` alır. Aktif günlük oturumdaki tek joker hakkını atomik olarak tüketir ve
o hücre için karışık sırada bir doğru, beş yanlış oyuncu döndürür. Aynı hücreden yinelenen istek
aynı altı oyuncuyu verir; farklı bir hücrede ikinci kullanım `JOKER_ALREADY_USED` ile reddedilir.
Altı uygun seçenek üretilemiyorsa hak tüketilmeden `JOKER_UNAVAILABLE` döner. Joker seçeneklerindeki
doğru oyuncu hücreye yerleştiğinde `filledCells` kaydındaki `jokerUsed` alanı `true` olur.
