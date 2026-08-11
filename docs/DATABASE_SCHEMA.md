# Veritabanı şeması ve migration politikası

90+9'un PostgreSQL şeması `packages/database/prisma/schema.prisma` içinde tanımlanır. SQL
migration'ları `packages/database/prisma/migrations` altında sürümlenir ve bütün ortamlarda aynı
sırayla uygulanır.

## Tablo grupları

| Grup             | Tablolar                                             | Amaç                                                                            |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Veri sürümü      | `dataset_versions`                                   | Snapshot kaynağını, checksum'ı, import durumunu ve regresyon sayılarını saklar. |
| Referans         | `seasons`, `countries`                               | Sezon etiketleri ile ülke ve konfederasyon eşleşmelerini tutar.                 |
| Canonical kimlik | `clubs`, `club_aliases`, `players`, `player_aliases` | Kaynak kimliklerini tekil canonical kayıtlara ve aranabilir alias'lara bağlar.  |
| Maç kanıtı       | `matches`, `player_match_evidence`                   | Sürüme bağlı maçları ve appearance/ilk 11/yedek kanıtlarını saklar.             |
| Oyun ilişkisi    | `player_club_seasons`, `club_seasons`                | Oyuncu–kulüp–sezon uygunluğunu, katılımı ve doğrulanmış şampiyonluğu saklar.    |
| Kalite yönetimi  | `data_overrides`, `data_quality_issues`              | Manuel düzeltmelerin denetim izini ve veri sorunlarının yaşam döngüsünü tutar.  |

## Temel güvenceler

- Kaynak oyuncu ve kulüp kimlikleri global olarak tektir.
- Maç ile oyuncu–kulüp–sezon kayıtları dataset sürümü içinde tektir. Böylece yeni bir sürüm,
  aktif sürümü değiştirmeden önce hazırlanıp doğrulanabilir.
- Aynı anda en fazla bir `active` dataset sürümü bulunabilir.
- Bir sezonda en fazla bir şampiyon işaretlenebilir. Her sezonda tam bir şampiyon bulunması import
  kalite kapısında ayrıca doğrulanır.
- Ev sahibi ve deplasman kulübü aynı olamaz; skorlar, kanıt sayıları, tarih aralıkları ve kritik
  override kaynakları veritabanı constraint'leriyle korunur.
- `2012/13`–`2025/26` arasındaki 14 sezon ilk migration ile seed edilir.
- Foreign key'ler canonical kanıt kayıtlarının kazara silinmesini engeller. Alias kayıtları kendi
  sahibi silindiğinde birlikte temizlenir.

## Migration akışı

Geliştirmede Prisma şeması değiştirildikten sonra migration oluşturulur ve incelenir. Paylaşılan
ortamlarda yalnızca depoya alınmış migration'lar uygulanır:

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:status
```

Yerel test veritabanında migration ve şema kabul kontrolü şu komutla çalışır:

```bash
pnpm db:test:schema
```

Bu kontrol migration'ları idempotent biçimde uygular; 13 uygulama tablosunu, 14 sezon seedini, 19
domain constraint'ini ve kritik partial unique indexleri doğrular. GitHub CI aynı kontrolü her
push ve pull request için temiz bir PostgreSQL servisi üzerinde çalıştırır.

## Geri alma ve ileri düzeltme

Production'da uygulanmış bir migration dosyası değiştirilmez ve otomatik destructive rollback
çalıştırılmaz. Hata durumunda veri kaybetmeyen yeni bir ileri düzeltme migration'ı hazırlanır. Acil
geri dönüş gerekiyorsa önce veritabanı yedeği alınır, uygulama önceki sürüme döndürülür ve veri
değişikliği ayrıca incelenir.

Yalnızca local/test verisi gözden çıkarılabiliyorsa korumalı `pnpm db:reset` komutu kullanılabilir;
bu komut açık onay değişkeni olmadan çalışmaz.
