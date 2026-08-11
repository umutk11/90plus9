# dcaribou Kaggle v677 veri kalite taban çizgisi

Bu belge, 90+9'un ilk sabitlenmiş snapshot'ı olan `v677` için tekrar üretilebilir veri doluluk
profilinin insan tarafından okunabilir özetidir. Profil şu komutla yeniden oluşturulur:

```bash
pnpm data:profile -- --version 677
```

## Genel sonuç

Durum: **Çözüm gerekiyor.** Kaynak şema ve kanıt bütünlüğü temizdir; ancak production importundan
önce dört eksik oyuncu profili ile oyuncu kanıtı olmayan 29 maçın çözülmesi gerekir.

| Ölçüm                               |   Sonuç |
| ----------------------------------- | ------: |
| Sezon                               |      14 |
| Süper Lig maç kaydı                 |   4.618 |
| Oyuncu kanıtı olan maç              |   4.589 |
| Appearance satırı                   | 132.464 |
| Lineup satırı                       | 170.904 |
| Kulüp                               |      43 |
| Kulüp–sezon                         |     261 |
| Oyuncu ID                           |   3.774 |
| Oyuncu–kulüp–sezon ilişkisi         |   9.347 |
| Kanıt kimliği/eşleşme/tekrar sorunu |       0 |
| Production öncesi açık kritik kayıt |      33 |

## Oyuncu alanlarının genel doluluğu

| Alan                  | Doluluk | Eksik oyuncu |
| --------------------- | ------: | -----------: |
| Kaynak oyuncu profili |  %99,89 |            4 |
| Oyuncu adı            |  %99,89 |            4 |
| Uyruk                 |  %98,75 |           47 |
| Genel mevki           |  %99,76 |            9 |
| Doğum tarihi          |  %99,81 |            7 |
| Ayak                  |  %94,62 |          203 |
| Boy                   |  %90,99 |          340 |
| Kulüp profili ve adı  |    %100 |            0 |

Mevki eksiği görünen dokuz kaydın dördü tamamen eksik oyuncu profilleridir. Kalan beş oyuncunun
kaynak `position` değeri `Missing` durumundadır: Sanharib Malki, Habib Habibou, Onur Cenik,
Mervan Müjdeci ve Sabri Çakır. Uyruk ve mevki eksikleri null/unknown olarak saklanabilir; ancak bu
oyuncular eksik alana dayanan grid kurallarında aday olamaz.

## Sezon bazlı profil

| Sezon   | Maç | Oyuncu | Eksik profil | Uyruk doluluk | Mevki doluluk | Appearance maç | Lineup maç |
| ------- | --: | -----: | -----------: | ------------: | ------------: | -------------: | ---------: |
| 2012/13 | 306 |    505 |            0 |        %99,41 |          %100 |        306/306 |      0/306 |
| 2013/14 | 306 |    580 |            0 |        %98,97 |        %99,66 |        306/306 |    306/306 |
| 2014/15 | 306 |    539 |            1 |        %98,52 |        %99,44 |        306/306 |    306/306 |
| 2015/16 | 306 |    570 |            0 |        %98,60 |        %99,65 |        306/306 |    306/306 |
| 2016/17 | 306 |    547 |            0 |        %98,54 |          %100 |        306/306 |    306/306 |
| 2017/18 | 306 |    583 |            0 |        %98,46 |          %100 |        306/306 |    306/306 |
| 2018/19 | 306 |    591 |            0 |        %98,14 |          %100 |        306/306 |    305/306 |
| 2019/20 | 306 |    644 |            0 |        %97,83 |          %100 |        306/306 |    306/306 |
| 2020/21 | 420 |    797 |            0 |        %98,49 |          %100 |        420/420 |    420/420 |
| 2021/22 | 380 |    734 |            0 |        %98,09 |          %100 |        380/380 |    380/380 |
| 2022/23 | 342 |    698 |            1 |        %95,27 |        %99,86 |        313/342 |    313/342 |
| 2023/24 | 380 |    759 |            0 |          %100 |        %99,87 |        380/380 |    380/380 |
| 2024/25 | 342 |    709 |            0 |          %100 |          %100 |        342/342 |    342/342 |
| 2025/26 | 306 |    689 |            2 |        %99,71 |        %99,56 |        306/306 |    305/306 |

2012/13 sezonunda lineup verisi olmaması beklenen kaynak sınırıdır; bu sezonda yalnızca appearance
kanıtı kullanılır. 2018/19 ve 2025/26 sezonlarında birer maçın lineup satırı yoktur fakat appearance
kanıtı bulunduğu için bu maçlar oynanmış kabul edilebilir.

## Production öncesi çözülmesi gereken kayıtlar

### Kaynak oyuncu profili olmayan oyuncular

| Kaynak oyuncu ID | Kaynak ad    |   Sezon | Kulüp ID | Kanıt            |
| ---------------: | ------------ | ------: | -------: | ---------------- |
|           258811 | Oguzhan Acar | 2014/15 |      449 | 2 lineup satırı  |
|           163380 | Aldin Cajic  | 2022/23 |      924 | 18 lineup satırı |
|          1076665 | Enes Seven   | 2025/26 |     2293 | 1 lineup satırı  |
|          1395711 | Arda Var     | 2025/26 |     2293 | 1 lineup satırı  |

Bu oyuncular otomatik ve eksik bir profil kaydıyla production'a alınmaz. Kaynak kimliği, ad,
kulüp ve temel profil alanları bağımsız kaynaktan doğrulanmalı veya oyuncu açıkça pasif QA kaydı
olarak işaretlenmelidir.

### Oyuncu kanıtı olmayan maçlar

2022/23 sezonunda 29 maçta appearance veya lineup kaydı yoktur. Bunlar hükmen sonuç görüntüsüyle
uyumludur; ancak sistem yalnızca skora bakarak otomatik `awarded` kararı vermez. Maçlar resmî karar
referansıyla eşleştirilene kadar production importu başarısız olmalıdır.
