# Referans verileri

Şehir, kulüp grubu, şampiyonluk ve benzeri küçük, elle doğrulanan ve sürümlenen referans verileri burada tutulacaktır. Her dosya kaynağını ve son doğrulama tarihini içermelidir.

İndirilen ham veri Git'e eklenmez. Tekrar üretilebilir kaynak sürümü, checksum ve kapsam envanteri
`source-snapshots` klasöründeki küçük metadata dosyalarında saklanır.

`exclusions` klasöründe her snapshot sürümü için uygulama importuna alınmayacak kaynak maç ve
oyuncu kimlikleri tutulur. Bu listeler ham snapshot'ı değiştirmez; staging ve canonical veri
üretilmeden önce uygulanır.

`club-identities` klasörü kaynak kulüp kimliğini önerilen canonical ada, şehre ve oyun
bayraklarına bağlayan inceleme kayıtlarını içerir. `country-mappings` klasörü kaynak ülke adlarıyla
oyuncu vatandaşlık/doğum metinlerinin ek canonical ülke, alias veya çözümsüz tarihsel değer olarak
sınıflandırılmasını tutar. `pending` kayıtlar kullanıcı onayı olmadan canonical importa alınmaz.
