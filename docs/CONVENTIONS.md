# Kod standartları

## Genel

- TypeScript `strict` modu bütün çalışma alanlarında zorunludur.
- Dosya adlarında küçük harf ve tire kullanılır; Next.js özel dosya adları framework kuralını izler.
- Tarihler uygulama sınırlarında ISO 8601 biçiminde taşınır.
- Sezon veritabanında başlangıç yılı olarak, kullanıcı arayüzünde `YYYY/YY` olarak gösterilir.

## İçe aktarma sırası

1. Yalnızca yan etki oluşturan importlar (örneğin global CSS)
2. Harici paketler
3. `@/` veya workspace alias importları
4. Göreli importlar

CSS sırası çıktıyı etkileybildiği için web uygulamasında importlar otomatik olarak sıralanmaz. Paylaşılan TypeScript paketlerinde sıralama ESLint ile uygulanır.

## Veritabanı ve API

- PostgreSQL tablo ve sütun adları `snake_case` kullanır.
- TypeScript alanları `camelCase` kullanır.
- API tarih alanları ISO 8601 metnidir.
- API hata gövdesi kararlı bir `code`, kullanıcıya güvenle gösterilebilen `message` ve istek takibi için `requestId` alanı içerecektir.
