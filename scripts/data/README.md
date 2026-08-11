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
