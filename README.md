# AfetLens

AfetLens, Türkiye ve çevresindeki güncel deprem verilerini etkileşimli bir
harita ve anlaşılır istatistiklerle sunan açık kaynaklı bir sismik hareketlilik
platformudur.

## Canlı demo

**[AfetLens'i aç](https://afetlens-tr.grassy-yew-2997.chatgpt.site/)**

> AfetLens resmi bir uyarı sistemi değildir ve deprem tahmini yapmaz. Sunulan
> veriler yalnızca bilgilendirme amaçlıdır.

## Özellikler

- USGS Earthquake Catalog üzerinden güncel deprem akışı
- Türkiye odaklı etkileşimli, koyu temalı harita
- 24 saat, 7 gün ve 30 gün zaman filtreleri
- Konum ve minimum büyüklük filtreleme
- Büyüklük, derinlik ve koordinat detayları
- Saatlik hareketlilik grafiği
- Filtrelenen veriyi CSV olarak indirme
- Canlı kaynak erişilemediğinde güvenli örnek veri modu
- Mobil ve masaüstü uyumlu arayüz

## Teknolojiler

- Next.js / React / TypeScript
- FastAPI yerine Cloudflare uyumlu Next.js API route
- Leaflet ve CARTO harita katmanları
- USGS FDSN Event Web Service
- vinext ve Cloudflare Workers

## Yerel geliştirme

Node.js `22.13.0` veya daha güncel bir sürüm gereklidir.

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

## Kontrol

```bash
npm run build
npm test
```

## Veri kaynağı

Canlı olaylar [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/)
üzerinden alınır. Sorgu Türkiye ve yakın çevresini kapsayan koordinat sınırlarıyla
30 günlük veriyi getirir.

## Hareketlilik endeksi

Endeks, seçili aralıktaki deprem sayısını ve büyüklüklerini özetleyen deneysel
bir göstergedir. Yapı stoku, yerel zemin ve nüfus verilerini içermediğinden
**risk puanı değildir**.
