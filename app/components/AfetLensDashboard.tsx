"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  Download,
  Gauge,
  Info,
  Layers3,
  LocateFixed,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Waves,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CircleMarker, LayerGroup, Map as LeafletMap } from "leaflet";

type Earthquake = {
  id: string;
  magnitude: number;
  location: string;
  occurredAt: string;
  updatedAt: string;
  longitude: number;
  latitude: number;
  depthKm: number;
  sourceUrl: string;
  status: string;
  source: string;
};

type ApiResponse = {
  earthquakes: Earthquake[];
  generatedAt: string;
  source: string;
  isFallback: boolean;
};

const HOUR = 60 * 60 * 1000;

const FALLBACK_EVENTS: Earthquake[] = [
  ["demo-1", 4.2, "14 km KD, Simav (Kütahya)", 2, 39.23, 28.98, 8.7],
  ["demo-2", 3.6, "Ege Denizi, Seferihisar açıkları", 5, 38.12, 26.61, 12.4],
  ["demo-3", 3.1, "Pütürge (Malatya)", 9, 38.21, 38.93, 7.1],
  ["demo-4", 2.8, "Sındırgı (Balıkesir)", 15, 39.24, 28.17, 10.8],
  ["demo-5", 2.5, "Kozan (Adana)", 22, 37.52, 35.83, 6.4],
  ["demo-6", 3.3, "Akdeniz, Kaş açıkları", 31, 36.04, 29.17, 18.2],
  ["demo-7", 2.7, "Bingöl merkez", 44, 38.89, 40.49, 5.6],
  ["demo-8", 4.0, "Girit Adası açıkları", 56, 35.41, 26.23, 24.5],
  ["demo-9", 2.4, "Gemlik Körfezi (Bursa)", 76, 40.44, 29.12, 9.2],
  ["demo-10", 3.0, "Doğanşehir (Malatya)", 101, 38.09, 37.89, 7.9],
].map(([id, magnitude, location, hoursAgo, latitude, longitude, depthKm]) => ({
  id: id as string,
  magnitude: magnitude as number,
  location: location as string,
  occurredAt: new Date(Date.now() - (hoursAgo as number) * HOUR).toISOString(),
  updatedAt: new Date().toISOString(),
  latitude: latitude as number,
  longitude: longitude as number,
  depthKm: depthKm as number,
  sourceUrl: "https://earthquake.usgs.gov/",
  status: "reviewed",
  source: "Örnek veri",
}));

const magnitudeColor = (magnitude: number) => {
  if (magnitude >= 5) return "#ef5b50";
  if (magnitude >= 4) return "#f47a58";
  if (magnitude >= 3) return "#f3b563";
  return "#80a89d";
};

const relativeTime = (iso: string) => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function AfetLensDashboard() {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, CircleMarker>>(new Map());
  const [events, setEvents] = useState<Earthquake[]>(FALLBACK_EVENTS);
  const [source, setSource] = useState("Örnek veri");
  const [generatedAt, setGeneratedAt] = useState(new Date().toISOString());
  const [isFallback, setIsFallback] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rangeHours, setRangeHours] = useState(24 * 7);
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(FALLBACK_EVENTS[0].id);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadEarthquakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/earthquakes", { cache: "no-store" });
      if (!response.ok) throw new Error("Data unavailable");
      const data = (await response.json()) as ApiResponse;
      if (data.earthquakes.length) {
        setEvents(data.earthquakes);
        setSelectedId(data.earthquakes[0].id);
        setSource(data.source);
        setGeneratedAt(data.generatedAt);
        setIsFallback(data.isFallback);
      }
    } catch {
      setEvents(FALLBACK_EVENTS);
      setSource("Örnek veri");
      setIsFallback(true);
      setGeneratedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEarthquakes();
  }, [loadEarthquakes]);

  const filteredEvents = useMemo(() => {
    const cutoff = Date.now() - rangeHours * HOUR;
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    return events.filter(
      (event) =>
        new Date(event.occurredAt).getTime() >= cutoff &&
        event.magnitude >= minMagnitude &&
        (!normalizedQuery ||
          event.location.toLocaleLowerCase("tr-TR").includes(normalizedQuery)),
    );
  }, [events, minMagnitude, query, rangeHours]);

  const selected = events.find((event) => event.id === selectedId) ?? filteredEvents[0];

  useEffect(() => {
    let cancelled = false;
    async function initializeMap() {
      if (!mapElementRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;
      const map = L.map(mapElementRef.current, {
        center: [39.0, 35.2],
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 },
      ).addTo(map);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20, pane: "shadowPane" },
      ).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
    }
    initializeMap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function drawMarkers() {
      if (!mapRef.current || !markerLayerRef.current) return;
      const L = await import("leaflet");
      markerLayerRef.current?.clearLayers();
      markerRefs.current.clear();
      filteredEvents.forEach((event) => {
        const color = magnitudeColor(event.magnitude);
        const marker = L.circleMarker([event.latitude, event.longitude], {
          radius: Math.max(5, event.magnitude * 3),
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.34,
          className: event.magnitude >= 4 ? "quake-marker quake-marker--pulse" : "quake-marker",
        });
        marker.on("click", () => setSelectedId(event.id));
        marker.bindTooltip(
          `<strong>M ${event.magnitude.toFixed(1)}</strong><br/>${event.location}`,
          { direction: "top", offset: [0, -7] },
        );
        marker.addTo(markerLayerRef.current!);
        markerRefs.current.set(event.id, marker);
      });
    }
    drawMarkers();
  }, [filteredEvents]);

  useEffect(() => {
    if (!selected || !mapRef.current) return;
    const marker = markerRefs.current.get(selected.id);
    if (marker) {
      marker.openTooltip();
      mapRef.current.panTo([selected.latitude, selected.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selected]);

  const stats = useMemo(() => {
    const magnitudes = filteredEvents.map((event) => event.magnitude);
    const max = magnitudes.length ? Math.max(...magnitudes) : 0;
    const averageDepth = filteredEvents.length
      ? filteredEvents.reduce((sum, event) => sum + event.depthKm, 0) / filteredEvents.length
      : 0;
    const activity = Math.min(
      99,
      Math.round(
        filteredEvents.reduce(
          (score, event) => score + Math.pow(Math.max(event.magnitude, 1), 1.45),
          0,
        ) / 2,
      ),
    );
    return { max, averageDepth, activity };
  }, [filteredEvents]);

  const hourlyBars = useMemo(() => {
    const buckets = new Array(12).fill(0) as number[];
    events.forEach((event) => {
      const hoursAgo = (Date.now() - new Date(event.occurredAt).getTime()) / HOUR;
      if (hoursAgo >= 0 && hoursAgo < 24) {
        buckets[Math.min(11, Math.floor(hoursAgo / 2))] += 1;
      }
    });
    return buckets.reverse();
  }, [events]);

  const downloadCsv = () => {
    const header = "tarih,buyukluk,derinlik_km,enlem,boylam,konum,kaynak\n";
    const rows = filteredEvents
      .map((event) =>
        [
          event.occurredAt,
          event.magnitude,
          event.depthKm,
          event.latitude,
          event.longitude,
          `"${event.location.replaceAll('"', '""')}"`,
          event.source,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${header}${rows}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `afetlens-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AfetLens ana sayfa">
          <span className="brand-mark" aria-hidden="true">
            <Waves size={20} />
          </span>
          <span>AfetLens</span>
          <span className="brand-badge">BETA</span>
        </a>
        <nav className="main-nav" aria-label="Ana navigasyon">
          <a className="active" href="#harita">Canlı Harita</a>
          <a href="#analiz">Analiz</a>
          <a href="#veri">Veri Kaynakları</a>
        </nav>
        <div className="topbar-actions">
          <button className="icon-button mobile-menu" aria-label="Menü">
            <Menu size={19} />
          </button>
          <button className="status-pill" onClick={loadEarthquakes}>
            <span className={`status-dot ${loading ? "loading" : ""}`} />
            {loading ? "Güncelleniyor" : "Sistem aktif"}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow"><Activity size={14} /> Türkiye / Sismik izleme</p>
          <h1>Yeryüzünün hareketini<br /><em>anlık</em> görün.</h1>
          <p className="hero-copy">
            Türkiye ve çevresindeki güncel deprem verilerini tek ekranda
            keşfedin; büyüklük, derinlik ve zamana göre anlamlandırın.
          </p>
        </div>
        <div className="hero-meta">
          <div>
            <span>Son veri güncellemesi</span>
            <strong>{formatDate(generatedAt)}</strong>
          </div>
          <button className="refresh-button" onClick={loadEarthquakes} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Şimdi yenile
          </button>
        </div>
      </section>

      <section className="metric-strip" aria-label="Deprem özeti">
        <article>
          <div className="metric-icon"><CircleDot size={19} /></div>
          <div><span>Filtrelenen deprem</span><strong>{filteredEvents.length}</strong></div>
          <small>Seçili zaman aralığı</small>
        </article>
        <article>
          <div className="metric-icon coral"><Gauge size={19} /></div>
          <div><span>En yüksek büyüklük</span><strong>M {stats.max.toFixed(1)}</strong></div>
          <small className="coral-text">Güncel katalog</small>
        </article>
        <article>
          <div className="metric-icon amber"><Layers3 size={19} /></div>
          <div><span>Ortalama derinlik</span><strong>{stats.averageDepth.toFixed(1)} km</strong></div>
          <small>Filtrelenen olaylar</small>
        </article>
        <article>
          <div className="metric-icon sage"><Activity size={19} /></div>
          <div><span>Hareketlilik endeksi</span><strong>{stats.activity}<i>/99</i></strong></div>
          <small>Bilgilendirme amaçlı</small>
        </article>
      </section>

      <section className="dashboard" id="harita">
        <div className="map-panel">
          <div className="panel-toolbar">
            <div>
              <p className="eyebrow"><LocateFixed size={14} /> Etkileşimli görünüm</p>
              <h2>Canlı deprem haritası</h2>
            </div>
            <div className="toolbar-actions">
              <div className="range-tabs" aria-label="Zaman aralığı">
                {[
                  [24, "24 saat"],
                  [24 * 7, "7 gün"],
                  [24 * 30, "30 gün"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={rangeHours === value ? "active" : ""}
                    onClick={() => setRangeHours(value as number)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="filter-toggle"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal size={16} /> Filtreler
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="filter-drawer">
              <label>
                <span>Konum ara</span>
                <div className="input-wrap">
                  <Search size={15} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="İl, ilçe veya bölge"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} aria-label="Aramayı temizle">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </label>
              <label>
                <span>En düşük büyüklük: M {minMagnitude.toFixed(1)}</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minMagnitude}
                  onChange={(event) => setMinMagnitude(Number(event.target.value))}
                />
              </label>
              <button className="download-button" onClick={downloadCsv}>
                <Download size={15} /> CSV indir
              </button>
            </div>
          )}

          <div className="map-wrap">
            <div ref={mapElementRef} className="map-canvas" aria-label="Türkiye deprem haritası" />
            <div className="map-legend">
              <span>Büyüklük</span>
              <i className="dot sage-dot" /> 0–2.9
              <i className="dot amber-dot" /> 3–3.9
              <i className="dot orange-dot" /> 4–4.9
              <i className="dot red-dot" /> 5+
            </div>
            {isFallback && (
              <div className="fallback-notice">
                <AlertTriangle size={15} />
                Canlı akışa ulaşılamadı; örnek veri gösteriliyor.
              </div>
            )}
          </div>
        </div>

        <aside className="detail-panel">
          <div className="detail-heading">
            <div>
              <p className="eyebrow"><MapPin size={14} /> Seçili olay</p>
              <h2>Deprem detayı</h2>
            </div>
            {selected && <span className="reviewed"><ShieldCheck size={14} /> {selected.status === "reviewed" ? "İncelendi" : "Otomatik"}</span>}
          </div>
          {selected ? (
            <>
              <div className="magnitude-block">
                <span style={{ color: magnitudeColor(selected.magnitude) }}>
                  M {selected.magnitude.toFixed(1)}
                </span>
                <div>
                  <strong>{selected.location}</strong>
                  <small><Clock3 size={13} /> {relativeTime(selected.occurredAt)}</small>
                </div>
              </div>
              <div className="detail-grid">
                <div><span>Derinlik</span><strong>{selected.depthKm.toFixed(1)} km</strong></div>
                <div><span>Tarih</span><strong>{formatDate(selected.occurredAt)}</strong></div>
                <div><span>Enlem</span><strong>{selected.latitude.toFixed(3)}°</strong></div>
                <div><span>Boylam</span><strong>{selected.longitude.toFixed(3)}°</strong></div>
              </div>
              <a className="source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">
                Kaynak kaydını aç <ArrowUpRight size={15} />
              </a>
            </>
          ) : (
            <div className="empty-state">Bu filtrelerle eşleşen olay bulunamadı.</div>
          )}

          <div className="recent-list">
            <div className="section-title">
              <span>Son olaylar</span>
              <button onClick={downloadCsv}>Dışa aktar</button>
            </div>
            <div className="event-scroll">
              {filteredEvents.slice(0, 8).map((event) => (
                <button
                  className={`event-row ${selected?.id === event.id ? "selected" : ""}`}
                  key={event.id}
                  onClick={() => setSelectedId(event.id)}
                >
                  <span
                    className="event-mag"
                    style={{ borderColor: magnitudeColor(event.magnitude), color: magnitudeColor(event.magnitude) }}
                  >
                    {event.magnitude.toFixed(1)}
                  </span>
                  <span className="event-copy">
                    <strong>{event.location}</strong>
                    <small>{relativeTime(event.occurredAt)} · {event.depthKm.toFixed(1)} km</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="analysis-grid" id="analiz">
        <article className="analysis-card activity-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow"><Activity size={14} /> Son 24 saat</p>
              <h3>Saatlik hareketlilik</h3>
            </div>
            <span>{events.filter((event) => Date.now() - new Date(event.occurredAt).getTime() <= 24 * HOUR).length} olay</span>
          </div>
          <div className="bar-chart" aria-label="Saatlik deprem sayısı grafiği">
            {hourlyBars.map((value, index) => {
              const max = Math.max(...hourlyBars, 1);
              return (
                <i
                  key={index}
                  style={{ height: `${Math.max(7, (value / max) * 100)}%` }}
                  title={`${value} deprem`}
                />
              );
            })}
          </div>
          <div className="chart-axis"><span>24 saat önce</span><span>Şimdi</span></div>
        </article>

        <article className="analysis-card" id="veri">
          <div className="card-heading">
            <div>
              <p className="eyebrow"><Database size={14} /> Veri güveni</p>
              <h3>Kaynak durumu</h3>
            </div>
            <span className={isFallback ? "warning-chip" : "live-chip"}>
              {isFallback ? "Demo" : "Canlı"}
            </span>
          </div>
          <div className="source-status">
            <div className="source-symbol"><Database size={20} /></div>
            <div>
              <strong>{source}</strong>
              <span>Son kontrol: {formatDate(generatedAt)}</span>
            </div>
            <ShieldCheck size={19} className="source-check" />
          </div>
          <p className="data-note">
            Veriler bilgilendirme amaçlıdır. AfetLens resmi uyarı sistemi değildir
            ve deprem tahmini yapmaz.
          </p>
        </article>

        <article className="analysis-card methodology-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow"><Info size={14} /> Metodoloji</p>
              <h3>Hareketlilik ne demek?</h3>
            </div>
          </div>
          <p>
            Endeks, seçili zaman aralığındaki olayların sayısı ve büyüklüğünü
            özetler. Yapı, zemin veya nüfus verisi içermediğinden bir risk puanı değildir.
          </p>
          <div className="method-tags">
            <span><CalendarDays size={13} /> Zaman</span>
            <span><Gauge size={13} /> Büyüklük</span>
            <span><MapPin size={13} /> Konum</span>
          </div>
        </article>
      </section>

      <footer>
        <div className="brand">
          <span className="brand-mark"><Waves size={18} /></span>
          <span>AfetLens</span>
        </div>
        <p>Açık deprem verilerini daha anlaşılır kılmak için geliştirildi.</p>
        <span>© {new Date().getFullYear()} · Bilgilendirme amaçlıdır.</span>
      </footer>
    </main>
  );
}
