# Veri kaynağı ve snapshot politikası

## Ana kaynak

90+9'un ana futbol veri kaynağı
[dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) projesidir.
Veri Transfermarkt kaynaklıdır ve kaynak proje tarafından
[CC0-1.0](https://github.com/dcaribou/transfermarkt-datasets/blob/master/LICENSE) ile
yayımlanmaktadır.

Projede kullanılacak atıf metni:

> 90+9'un futbol verileri dcaribou/transfermarkt-datasets projesinden hazırlanmıştır. Kaynak veri
> CC0-1.0 ile yayımlanır. Transfermarkt adı ve markaları kendi sahiplerine aittir; 90+9 bağımsız
> bir projedir.

Oyuncu görselleri ve kulüp logoları kaynak veri içinde bulunsa bile 90+9 tarafından kullanılmaz.

## Dağıtım seçimi

Snapshot indirmelerinde aynı üreticinin resmi
[Kaggle dağıtımı](https://www.kaggle.com/datasets/davidcariboo/player-scores) kullanılır. Kaggle
sürüm numarası URL içinde sabitlenebildiği için aynı snapshot tekrar indirilebilir. Kaynak projenin
R2 üzerindeki DuckDB adresi `latest` niteliğindedir; production importunun tek başına bu değişken
adrese dayanmasına izin verilmez.

İlk sabitlenmiş snapshot `v677` sürümüdür. Ayrıntılı teknik kayıt
[`data/reference/source-snapshots/dcaribou-kaggle-v677.json`](../data/reference/source-snapshots/dcaribou-kaggle-v677.json)
dosyasındadır.

Beklenen 12 CSV dosyasının sütun ve tip sözleşmesi
[`scripts/data/source-schema.json`](../scripts/data/source-schema.json) içinde sürümlenir. Her
snapshot importtan önce `pnpm data:validate -- --version <sürüm>` ile tam taranır.

İlk snapshot'ın sezon bazlı alan dolulukları ve açık kalite sorunları
[`docs/DATA_QUALITY_BASELINE.md`](DATA_QUALITY_BASELINE.md) belgesinde kayıtlıdır.

Snapshot'a özel ürün kapsamı dışlamaları
[`data/reference/exclusions`](../data/reference/exclusions) altında sürümlenir. `v677` için oyuncu
kanıtı olmayan 29 maç ile kaynak profili olmayan dört oyuncu uygulama importuna alınmaz. Bu
dışlamalar ham snapshot'ı değiştirmez ve `pnpm data:profile` tarafından otomatik uygulanır.

## Saklama ve değişmezlik

- `data/raw` altındaki snapshot'lar Git'e eklenmez.
- İndirilen ZIP ve açılmış CSV dosyaları değiştirilmez; temizlik ve dönüşüm `data/staging` altında
  yapılır.
- Staging çıktısı `pnpm data:stage -- --version <sürüm>` ile DuckDB biçiminde yeniden üretilir;
  Git'e veya ham snapshot arşivine yazılmaz.
- Local geliştirmede üzerinde çalışılan snapshot tutulur.
- Staging ve production arşivinde aktif snapshot ile bir önceki snapshot saklanır.
- Production importu açık sürüm numarası ve önceden onaylanmış SHA-256 değeri olmadan başlamaz.

## Ülke adları

Canonical ülke görünen adları Unicode CLDR'nin İngilizce ve Türkçe territory listelerinden
hazırlanır. Kullanılan CLDR repository commit kimliği `data/reference/country-identities` altındaki
sürümlü dosyada tutulur. Futbol ülkeleri, kullanıcı tercihli kısa adlar ve tarihsel ülkeler aynı
dosyada açık kayıtlarla yönetilir; canlı ağ isteği sırasında isim üretilmez.

## Süper Lig şampiyonları

2012/13–2025/26 sezonlarının şampiyonları
[TFF Süper Lig şampiyonluk arşivinden](https://www.tff.org/default.aspx?pageID=545) doğrulanır.
Her sezonun ayrı resmî TFF arşiv bağlantısı, canonical kaynak kulüp kimliği ve son doğrulama
bilgisi
[`data/reference/champions/super-lig-dcaribou-v677.json`](../data/reference/champions/super-lig-dcaribou-v677.json)
dosyasında sürümlenir. Canonical import; her sezonda tam bir şampiyon bulunmasını, şampiyon
kulübün ilgili sezon Süper Lig katılım kaydına sahip olmasını ve kaynak/denetim alanlarının dolu
olmasını zorunlu tutar.

## Oyun uygunluğu açısından kullanım

- Oyuncu–kulüp–sezon kanıtı `appearances` ve `game_lineups` kayıtlarının birleşiminden üretilir.
- `2012/13` sezonunda lineup verisi olmadığı için yalnızca `appearances` kullanılır.
- `transfers` oyun uygunluğu kanıtı değildir; yalnızca veri kalite kontrolünde yardımcı kaynaktır.
- Uygulama importundan dışlanan maç ve oyunculardan uygunluk ilişkisi üretilmez.
- Dışlama kararı maçın resmî durumunu otomatik olarak `awarded` sınıfına sokmaz.
