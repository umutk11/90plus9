# dcaribou Kaggle v677 veri kalite taban çizgisi

Bu belge, 90+9'un ilk sabitlenmiş snapshot'ı olan `v677` için tekrar üretilebilir veri doluluk
profilinin insan tarafından okunabilir özetidir. Profil şu komutla yeniden oluşturulur:

```bash
pnpm data:profile -- --version 677
```

## Genel sonuç

Durum: **Geçti.** Ham snapshot'taki oyuncu kanıtı olmayan 29 maç ve kaynak oyuncu profili
bulunmayan dört oyuncu, sürümlü ürün kararıyla uygulama importundan çıkarıldı. Kaynak ZIP ve CSV
dosyaları değiştirilmedi.

| Ölçüm                               | Ham kaynak | Uygulama importu |
| ----------------------------------- | ---------: | ---------------: |
| Sezon                               |         14 |               14 |
| Süper Lig maç kaydı                 |      4.618 |            4.589 |
| Oyuncu kanıtı olan maç              |      4.589 |            4.589 |
| Appearance satırı                   |    132.464 |          132.464 |
| Lineup satırı                       |    170.904 |          170.882 |
| Kulüp                               |         43 |               43 |
| Kulüp–sezon                         |        261 |              261 |
| Oyuncu ID                           |      3.774 |            3.770 |
| Oyuncu–kulüp–sezon ilişkisi         |      9.347 |            9.343 |
| Kanıt kimliği/eşleşme/tekrar sorunu |          0 |                0 |
| Production öncesi açık kritik kayıt |         33 |                0 |

## Oyuncu alanlarının genel doluluğu

| Alan                  | Doluluk | Eksik oyuncu |
| --------------------- | ------: | -----------: |
| Kaynak oyuncu profili |    %100 |            0 |
| Oyuncu adı            |    %100 |            0 |
| Uyruk                 |  %98,86 |           43 |
| Genel mevki           |  %99,87 |            5 |
| Doğum tarihi          |  %99,92 |            3 |
| Ayak                  |  %94,72 |          199 |
| Boy                   |  %91,09 |          336 |
| Kulüp profili ve adı  |    %100 |            0 |

Mevki eksiği kalan beş oyuncunun kaynak `position` değeri `Missing` durumundadır: Sanharib
Malki, Habib Habibou, Onur Cenik, Mervan Müjdeci ve Sabri Çakır. Uyruk ve mevki eksikleri
null/unknown olarak saklanabilir; ancak bu oyuncular eksik alana dayanan grid kurallarında aday
olamaz.

## Sezon bazlı profil

| Sezon   | Maç | Oyuncu | Eksik profil | Uyruk doluluk | Mevki doluluk | Appearance maç | Lineup maç |
| ------- | --: | -----: | -----------: | ------------: | ------------: | -------------: | ---------: |
| 2012/13 | 306 |    505 |            0 |        %99,41 |          %100 |        306/306 |      0/306 |
| 2013/14 | 306 |    580 |            0 |        %98,97 |        %99,66 |        306/306 |    306/306 |
| 2014/15 | 306 |    538 |            0 |        %98,70 |        %99,63 |        306/306 |    306/306 |
| 2015/16 | 306 |    570 |            0 |        %98,60 |        %99,65 |        306/306 |    306/306 |
| 2016/17 | 306 |    547 |            0 |        %98,54 |          %100 |        306/306 |    306/306 |
| 2017/18 | 306 |    583 |            0 |        %98,46 |          %100 |        306/306 |    306/306 |
| 2018/19 | 306 |    591 |            0 |        %98,14 |          %100 |        306/306 |    305/306 |
| 2019/20 | 306 |    644 |            0 |        %97,83 |          %100 |        306/306 |    306/306 |
| 2020/21 | 420 |    797 |            0 |        %98,49 |          %100 |        420/420 |    420/420 |
| 2021/22 | 380 |    734 |            0 |        %98,09 |          %100 |        380/380 |    380/380 |
| 2022/23 | 313 |    697 |            0 |        %95,41 |          %100 |        313/313 |    313/313 |
| 2023/24 | 380 |    759 |            0 |          %100 |        %99,87 |        380/380 |    380/380 |
| 2024/25 | 342 |    709 |            0 |          %100 |          %100 |        342/342 |    342/342 |
| 2025/26 | 306 |    687 |            0 |          %100 |        %99,85 |        306/306 |    305/306 |

2012/13 sezonunda lineup verisi olmaması beklenen kaynak sınırıdır; bu sezonda yalnızca appearance
kanıtı kullanılır. 2018/19 ve 2025/26 sezonlarında birer maçın lineup satırı yoktur fakat appearance
kanıtı bulunduğu için bu maçlar oynanmış kabul edilebilir.

## Uygulama importundan çıkarılan kayıtlar

### Kaynak oyuncu profili olmayan oyuncular

| Kaynak oyuncu ID | Kaynak ad    |   Sezon | Kulüp ID | Kanıt            |
| ---------------: | ------------ | ------: | -------: | ---------------- |
|           258811 | Oguzhan Acar | 2014/15 |      449 | 2 lineup satırı  |
|           163380 | Aldin Cajic  | 2022/23 |      924 | 18 lineup satırı |
|          1076665 | Enes Seven   | 2025/26 |     2293 | 1 lineup satırı  |
|          1395711 | Arda Var     | 2025/26 |     2293 | 1 lineup satırı  |

Bu dört oyuncu ve onlara ait toplam 22 lineup satırı canonical oyuncu ve ilişki üretimine alınmaz.

### Oyuncu kanıtı olmayan maçlar

2022/23 sezonunda appearance veya lineup kaydı olmayan 29 maç uygulama importuna alınmaz. Bu karar
maçların resmî durumunu sınıflandırmaz; yalnızca 90+9 veri kapsamından çıkarır.

Kesin kaynak kimlikleri ve karar kaydı
[`data/reference/exclusions/dcaribou-kaggle-v677.json`](../data/reference/exclusions/dcaribou-kaggle-v677.json)
dosyasındadır. Profil komutu bu dosyayı otomatik uygular; dışlama sonrasında bilinmeyen eksik profil
veya oyuncu kanıtı olmayan maç kalırsa production kontrolü yine başarısız olur.

## Canonical PostgreSQL kalite sonucu

Canonical importtan sonra tam kalite kapısı şu komutla yeniden çalıştırılır:

```bash
pnpm data:quality -- --version 677
```

`v677` uygulama veritabanı sonucu **geçti**:

| Kontrol                                   | Sonuç |
| ----------------------------------------- | ----: |
| Resmî kaynakla doğrulanmış şampiyon sezon |    14 |
| Kanıtsız oyuncu–kulüp–sezon ilişkisi      |     0 |
| Kanıt sayısı/bayrak/tarih uyuşmazlığı     |     0 |
| Maç kulübü uyuşmazlığı                    |     0 |
| Sezon tarihi dışında kanıt                |     0 |
| Aynı maçta iki kulüp adına görünen oyuncu |     0 |
| Açık kritik kalite sorunu                 |     0 |
| Açık manuel inceleme kuyruğu              |     2 |

İki açık `warning` kuyruğu, kaynakta vatandaşlığı boş 43 oyuncu ile genel mevkisi boş beş
oyuncunun kaynak kimliklerini tutar. Değerler tahminle doldurulmaz; ilgili alanı kullanan oyun
kurallarında bu oyuncular aday olmaz. Ayrıca 26 aynı-normalize-ad grubu, 521 tek kanıtlı ilişki ve
bir sezonda ikiden fazla kulüpte görünen bir oyuncu raporda uyarı olarak izlenir. Bunlar canonical
kimlik veya kanıt bütünlüğünü bozmadığı için aktivasyonu engelleyen kritik hata değildir.

2019/20 sezonunun COVID nedeniyle 26 Temmuz 2020'ye kadar uzadığı, sezon tarihi kontrolünde bilinen
geçerli istisna olarak kapsanır.
