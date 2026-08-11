# 90+9

**90+9, Türkiye Süper Lig oyuncularını tahmin ederek her gün tamamladığın 3×3 günlük grid oyunudur.**

Bu depo 90+9'un web uygulamasını, veritabanı katmanını, kural motorunu ve veri hazırlama araçlarını birlikte barındırır. Proje şu anda geliştirme altyapısı aşamasındadır.

## MVP kapsamı

- 2012/13–2025/26 Türkiye erkekler Süper Lig sezonları
- Her gün herkes için aynı 3×3 grid
- Sunucu tarafında cevap doğrulama
- Sınırsız yanlış tahmin hakkı; kaybetme durumu yok
- Hesap gerektirmeyen anonim oyun oturumu
- Responsive web deneyimi

Ayrıntılı kararlar için [ürün kararları](docs/PRODUCT_DECISIONS.md), [veri kaynağı ve snapshot
politikası](docs/DATA_SOURCES.md), [veri kalite taban çizgisi](docs/DATA_QUALITY_BASELINE.md),
[veritabanı şeması ve migration politikası](docs/DATABASE_SCHEMA.md),
uygulanabilir görevler için [geliştirme yol haritası](90PLUS9_YOL_HARITASI.md) belgelerine bakın.

## Teknik temel

- Next.js App Router ve TypeScript
- pnpm workspaces
- PostgreSQL ve Prisma ORM
- ESLint, Prettier ve Vitest

## Klasör yapısı

```text
apps/web                 Next.js web uygulaması
packages/database        Prisma şeması ve veritabanı katmanı
packages/rules           Paylaşılan oyun/kural mantığı
scripts/data             Veri indirme ve ETL komutları
data/reference           Elle doğrulanan küçük referans verileri
data/raw                 Yerel ham veriler; Git'e alınmaz
data/staging             Yerel ara çıktılar; Git'e alınmaz
reports/data-quality     Üretilen veri kalite raporları; Git'e alınmaz
docs/adr                 Mimari karar kayıtları
docs/api                 API belgeleri
```

## Yerel kurulum

Gereksinimler:

- Node.js 24 LTS
- pnpm 11.16
- Docker Desktop veya Docker uyumlu bir local container ortamı (örneğin Colima)
- DuckDB CLI (yalnızca veri snapshot'larını inceleme ve doğrulama adımları için)

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

Web uygulaması varsayılan olarak `http://localhost:3000` adresinde açılır.
`pnpm db:up`, local uygulama ve test veritabanlarını oluşturur ve iki bağlantıyı da doğrular.
Veritabanı yalnızca `127.0.0.1` üzerinden bilgisayarınıza açılır; Docker volume'u sayesinde
bilgisayar yeniden başlatıldığında veriler korunur.

Local ortamda iki farklı PostgreSQL kullanıcısı vardır:

- `plus9_migrator`: Prisma migration'larını ve şema değişikliklerini çalıştırır.
- `plus9_app`: Uygulamanın çalışma sırasında kullanacağı sınırlı yetkili hesaptır.

Bu kullanıcıların parolaları yalnızca local geliştirme içindir. Canlı ortamda farklı ve gizli
değerler kullanılacaktır.

## Komutlar

```bash
pnpm dev          # Web geliştirme sunucusu
pnpm build        # Tüm çalışma alanlarını üretim için doğrula/derle
pnpm lint         # Statik kod kontrolleri
pnpm typecheck    # TypeScript kontrolleri
pnpm test         # Birim testleri
pnpm format       # Biçim kontrolü
pnpm format:write # Dosyaları biçimlendir
pnpm data:champions -- --version 677 # Resmî Süper Lig şampiyonluk referansını doğrula
pnpm data:download -- --version 677 # Sabitlenmiş ham veri snapshot'ını indir
pnpm data:profile -- --version 677 # Sezon bazlı veri doluluk raporu
pnpm data:quality -- --version 677 # Canonical verinin tam kalite kapısını çalıştır
pnpm data:references -- --version 677 # Kulüp ve ülke referans taslaklarını doğrula
pnpm data:stage -- --version 677 # Doğrulanmış ETL staging veritabanını üret
pnpm data:import -- --version 677 --activate # Canonical veriyi PostgreSQL'e yükle ve etkinleştir
pnpm data:validate -- --version 677 # CSV dosya, sütun, tip ve encoding kontrolü
pnpm db:up        # Local PostgreSQL'i başlat ve bağlantıları doğrula
pnpm db:check     # Uygulama ve test veritabanı bağlantılarını kontrol et
pnpm db:status    # PostgreSQL durumunu göster
pnpm db:down      # PostgreSQL'i durdur; verileri koru
pnpm db:generate  # Prisma istemcisini üret
pnpm db:migrate   # Bekleyen migration'ları güvenli biçimde uygula
pnpm db:migrate:status # Migration durumunu göster
pnpm db:test:schema # Test DB migration ve şema kabul kontrolü
pnpm db:validate  # Prisma yapılandırmasını doğrula
```

Local verileri tamamen sıfırlamak gerektiğinde korumalı komut kullanılır:

```bash
CONFIRM_DATABASE_RESET=90plus9-local pnpm db:reset
```

Bu komut yalnızca `local` veya `test` ortamında çalışır ve Docker volume'undaki local verileri
siler. Normal kullanımda gerekli değildir.

## Veri kaynağı ve atıf

Ana veri kaynağı [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) projesidir. Kaynak veri [CC0-1.0](https://github.com/dcaribou/transfermarkt-datasets/blob/master/LICENSE) ile yayımlanmaktadır. Kullanılan her snapshot'ın kaynak commit'i, indirme adresi ve checksum'ı veri sürümüyle birlikte kaydedilecektir.

Transfermarkt adı ve ilgili markalar kendi sahiplerine aittir. 90+9 bağımsız bir projedir ve Transfermarkt ile bağlantılı veya onun tarafından desteklenmiş değildir.

Bu depodaki uygulama kodu için henüz ayrıca bir açık kaynak lisansı seçilmemiştir.
