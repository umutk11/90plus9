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
