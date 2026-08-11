# Veri komutları

Ham snapshot, dcaribou'nun resmi Kaggle dağıtımından açık bir sürüm numarasıyla indirilir:

```bash
pnpm data:download -- --version 677
```

Komut arşivi `data/raw` altında sürüm numarasıyla saklar, ZIP bütünlüğünü kontrol eder, SHA-256
hesaplar ve aynı klasöre bir manifest yazar. Yarım kalan `.part` dosyası geçerli snapshot olarak
kullanılmaz. Mevcut bir sürüm tekrar çalıştırıldığında kaydedilmiş checksum yeniden doğrulanır.

Yalnızca geçici local incelemelerde en son sürüm otomatik seçilebilir:

```bash
pnpm data:download -- --latest
```

Production indirmesinde hem açık sürüm hem de önceden onaylanmış checksum zorunludur:

```bash
PLUS9_ENVIRONMENT=production pnpm data:download -- --version 677 --expected-sha256 <sha256>
```

Ham snapshot'lar değiştirilemez kabul edilir ve Git'e eklenmez. Local ortamda yalnızca üzerinde
çalışılan sürümün tutulması yeterlidir. Staging ve production arşivinde aktif snapshot ile bir
önceki snapshot saklanır.

## Kaynak şema doğrulaması

İndirilen snapshot'ın 12 CSV dosyası tam taramayla doğrulanır:

```bash
pnpm data:validate -- --version 677
```

Bu kontrol:

- Beklenen CSV dosyalarından veya sütunlardan biri eksikse başarısız olur.
- Beklenen bir sütunun DuckDB tipi değişmişse başarısız olur.
- UTF-8, virgül ayırıcı ve çift tırnak kurallarıyla herhangi bir satır ayrıştırılamıyorsa başarısız
  olur.
- Yeni dosya veya sütunları raporlar; bilinen şema hâlâ güvenliyse yalnızca uyarı verir.
- Sonucu `reports/data-quality` altında Git'e eklenmeyen bir JSON raporuna yazar.

Beklenen kaynak sözleşmesi `scripts/data/source-schema.json` dosyasında sürümlenir. Kaynak şema
bilinçli biçimde değiştiğinde önce fark incelenir, ardından bu sözleşme güncellenir.

## Sezon bazlı doluluk profili

Süper Lig kapsamındaki kritik alanlar ve oyuncu profili dolulukları sezon sezon ölçülür:

```bash
pnpm data:profile -- --version 677
```

Komut maç, appearance, lineup, oyuncu ve kulüp kayıtlarını birlikte inceler. Kimlik eksikleri,
yanlış maç-kulüp eşleşmeleri, tekrarlar, oyuncu profil alanlarının doluluk oranları ve oyuncu
kanıtı olmayan maçlar `reports/data-quality` altında JSON ve Markdown olarak raporlanır.

Profil, snapshot sürümüyle aynı adlı `data/reference/exclusions` dosyasını zorunlu olarak yükler.
Bu dosyadaki maç ve oyuncular ham CSV'lerden silinmez; yalnızca uygulama importu kapsamından
çıkarılır. Dışlama dosyası yoksa veya sürümü uyuşmuyorsa komut başarısız olur.

Local ortamda dışlamalar sonrasında kalan açık sorunlar raporlanır. Production kontrolü açık
kritik sorun varsa başarısız olur:

```bash
PLUS9_ENVIRONMENT=production pnpm data:profile -- --version 677
```

## ETL staging veritabanı

Doğrulanmış snapshot, PostgreSQL'e yüklenmeden önce tekrar üretilebilir bir DuckDB staging
veritabanına dönüştürülür:

```bash
pnpm data:stage -- --version 677
```

Komut önce 12 kaynak CSV'nin şema ve tam satır taramasını çalıştırır, ardından sürüme bağlı maç ve
oyuncu dışlamalarını otomatik uygular; ham CSV dosyalarını değiştirmez. Çıktı
`data/staging/dcaribou-kaggle-v<version>/staging.duckdb` altında oluşturulur ve Git'e eklenmez.
Aynı komut tekrar çalıştırıldığında staging çıktısını atomik biçimde yeniler.

Üretilen tablolar:

- `stg_seasons`: normalize edilmiş sezon başlangıç/bitiş yılları ve etiketleri.
- `stg_countries`: kaynak ülke kayıtları; Türkçe görünen adlar sonraki referans aşamasında eklenir.
- `stg_clubs`: Süper Lig kapsamındaki kaynak kulüpler ve arama anahtarları.
- `stg_players`: kanıtı bulunan oyuncular, normalize adları ve profil alanları.
- `stg_matches`: dışlamalar sonrası oynanmış kabul edilen Süper Lig maçları.
- `stg_player_match_evidence`: appearance, ilk 11 ve yedek kanıtlarının tek sözleşmede birleşimi.
- `stg_player_club_seasons`: kanıtlardan toplanan oyun uygunluğu ilişkileri.
- `stg_club_seasons`: maçlardan türetilen kulüp–sezon katılımları.

Komut beklenen regresyon sayılarını, source ID tekrarlarını, foreign-key adaylarını, maç-kulüp ve
tarih eşleşmelerini, enum dönüşümlerini, ilişki toplamlarını ve dışlanan kayıtların yokluğunu
kontrol eder. Tek bir hata bile bulunursa geçerli staging çıktısı yayımlanmaz. Sonuç özeti aynı
klasördeki `manifest.json` dosyasına yazılır.

## Kulüp ve ülke referans taslakları

Staging kapsamındaki 43 kulübün kaynak kimliğiyle önerilen Türkçe adı/şehri ve oyuncularda geçen
ülke metinlerinin eşleştirme kapsamı şu komutla doğrulanır:

```bash
pnpm data:references -- --version 677
```

Kulüp adları `data/reference/club-identities`, canonical/Türkçe ülke adları
`data/reference/country-identities`, ülke override kayıtları `data/reference/country-mappings`
altında sürümlenir. Kaynak ülke adıyla birebir eşleşen değerler otomatik kapsanır; kaynak ülke
tablosunda bulunmayan modern ülkeler ve alias'lar açık override kaydına ihtiyaç duyar.
Çekoslovakya, SSCB ve Yugoslavya gibi değerler günümüzdeki bir vatandaşlığa tahminle çevrilmez;
tarihsel doğum ülkesi olarak korunur.

Komut eksik/fazla kaynak kimliği, tekrar eden canonical kulüp adı, şehir/İstanbul bayrağı,
`dört büyük` bayrakları, 165 canonical ülke kimliğini, Türkçe ad çakışmalarını, ülke override
kapsamını ve ISO kod biçimini kontrol eder. Yapısal kontrol başarılı olsa bile `pending` kayıtlar
canonical importa hazır sayılmaz. Oyuncularda kullanılan tüm kaynak ülke metinlerini içeren
inceleme tablosu
`reports/data-quality/dcaribou-kaggle-v<version>-reference-mappings.md` altında üretilir.
