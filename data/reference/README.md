# Referans verileri

Şehir, kulüp grubu, şampiyonluk ve benzeri küçük, elle doğrulanan ve sürümlenen referans verileri burada tutulacaktır. Her dosya kaynağını ve son doğrulama tarihini içermelidir.

İndirilen ham veri Git'e eklenmez. Tekrar üretilebilir kaynak sürümü, checksum ve kapsam envanteri
`source-snapshots` klasöründeki küçük metadata dosyalarında saklanır.

`exclusions` klasöründe her snapshot sürümü için uygulama importuna alınmayacak kaynak maç ve
oyuncu kimlikleri tutulur. Bu listeler ham snapshot'ı değiştirmez; staging ve canonical veri
üretilmeden önce uygulanır.

`club-identities` klasörü kaynak kulüp kimliğini önerilen canonical ada, şehre ve oyun
bayraklarına bağlayan inceleme kayıtlarını içerir. `country-identities` klasörü kaynak, oyuncu ve
tarihsel ülke kayıtlarının canonical/Türkçe adlarını tutar. Türkçe ülke adları commit kimliğiyle
sabitlenmiş Unicode CLDR verisinden hazırlanır; kullanıcı tercihi gereken kısa adlar referans
kaydında açıkça sürümlenir. `country-mappings` klasörü oyuncu vatandaşlık/doğum metinlerini
canonical ülke, alias veya tarihsel ülke olarak sınıflandırır. `pending` kayıtlar kullanıcı onayı
olmadan canonical importa alınmaz.
