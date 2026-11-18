# LAPORAN TUGAS 7.1 PRAKTIKUM PEMROGRAMAN PERANGKAT BERGERAK
# MODUL VI – REACT NATIVE

**Laboratorium Rekayasa Perangkat Lunak**  
**Departemen Teknik Komputer – Fakultas Teknik**  
**Universitas Diponegoro**  
**2026**

---

### IDENTITAS KELOMPOK 10

| No | Nama Lengkap | NIM | Peran dalam Tim |
|:--:|:-------------|:---:|:----------------|
| 1 | **Anindya Fairuz Az Zahra** | 21120124120018 | Mobile App Developer / Fullstack Engineer |
| 2 | **Farrel Satya Lukito** | 21120124140111 | UI/UX Designer / Frontend Specialist |
| 3 | **Yunita Dwi Ardilasari** | 21120124120001 | Backend Developer / Database Administrator |
| 4 | **Amirah Rahmah Wijayanti ** | 21120124130068 | IoT System & QA Engineer |

---

## 7.6.1 Splash Screen

### 1. Tujuan
Membuat custom splash screen transisional yang muncul saat aplikasi dibuka dengan desain modern, minimalis, dan profesional, menampilkan identitas aplikasi monitoring suhu dan Kelompok 10, serta memastikan alur inisialisasi berjalan mulus tanpa menghambat performa atau menyebabkan aplikasi *freeze/stuck*.

### 2. Penjelasan Implementasi
Komponen Splash Screen diimplementasikan pada file `app/src/components/SplashScreen.js` dan dikontrol dari state `showSplash` pada root aplikasi `app/App.js`. 
- **Animasi Ring Pulsing:** Menggunakan `Animated.loop` dengan `Animated.sequence` pada skala (1.0 hingga 1.15) di sekitar ikon termometer ber-tinting biru primer (`#2563EB`).
- **Entrance & Exit Transition:** Menggunakan kombinasi `Animated.spring` dan `Animated.timing` untuk memunculkan konten (*fade in* dan *scale in*), kemudian setelah jeda 2.2 detik (waktu ideal untuk inisialisasi konfigurasi Expo dan font), transisi keluar dijalankan dengan *fade out* lembut (`exitAnim`), memanggil callback `onFinish()` untuk me-mount `NavigationContainer`.
- **Elemen Identitas:** Menampilkan ikon termometer dalam lingkaran berelevasi, nama aplikasi `LiveTemp` dengan font monospaced, deskripsi singkat *"IoT Temperature Telemetry & Control"*, badge *"KELOMPOK 10 · PRAKTIKUM PPB"*, tiga titik indikator loading, dan footer resmi institusi (*Teknik Komputer · Universitas Diponegoro*).

### 3. Source Code yang Ditambahkan
**File:** `app/src/components/SplashScreen.js`
```javascript
import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { tokens } from "../theme/tokens.js";

const { color, space, radius } = tokens;

export function CustomSplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    const timer = setTimeout(() => {
      Animated.timing(exitAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        pulseLoop.stop();
        if (onFinish) onFinish();
      });
    }, 2200);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [fadeAnim, scaleAnim, pulseAnim, exitAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.iconCircle}>
            <Ionicons name="thermometer-outline" size={48} color={color.primary} />
          </View>
        </View>
        <Text style={styles.title}>LiveTemp</Text>
        <Text style={styles.subtitle}>IoT Temperature Telemetry & Control</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>KELOMPOK 10 · PRAKTIKUM PPB</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive, { opacity: 0.7 }]} />
          <View style={[styles.dot, styles.dotActive, { opacity: 0.4 }]} />
        </View>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Teknik Komputer · Universitas Diponegoro</Text>
      </View>
    </Animated.View>
  );
}
```

### 4. Screenshot Hasil Akhir
*Simpan file tangkapan layar pada:* `PPB-Modul6/documentation/screenshots/splash-screen.png`  
![Splash Screen](../screenshots/splash-screen.png)

### 5. Analisis Hasil
Implementasi Splash Screen berhasil meningkatkan *User Experience* (UX) secara signifikan. Penggunaan *native driver* pada React Native Animated API menjamin animasi berjalan pada 60 FPS tanpa *frame drop*. Waktu jeda 2.2 detik memberikan kesempatan bagi aplikasi untuk memeriksa modul konfigurasi dan inisialisasi pustaka tanpa membuat pengguna menunggu lama. Transisi keluar berderajat opasitas halus (*fade-out*) mengeliminasi fenomena *white screen flicker* saat navigasi tab mulai di-render.

---

## 7.6.2 Pagination Monitoring

### 1. Tujuan
Menyediakan mekanisme navigasi data berbasis halaman (pagination) pada riwayat pembacaan sensor (*Triggered Alarm History*) di halaman Monitoring, membatasi beban transfer data jaringan, mencegah duplikasi data, dan mempertahankan pembaruan suhu langsung (*live telemetry*) melalui MQTT.

### 2. Penjelasan Cara Kerja Pagination
1. **Model & Endpoint Backend:**
   - Pada file `backend/src/models/readingsModel.js`, fungsi `list(page, limit)` dioptimasi. Ketika parameter `page` dan `limit` diterima, query SQL dijalankan dengan klausa `LIMIT $1 OFFSET $2`, di mana `OFFSET = (page - 1) * limit`.
   - Backend juga menjalankan query `SELECT COUNT(*) AS total FROM public.sensor_readings` untuk menghitung total baris dan menghitung `totalPages = Math.ceil(total / limit)`.
   - Respons dikirim dalam format JSON: `{ data, total, page, limit, totalPages }`.
   - Jika endpoint diakses tanpa parameter query, fungsi tetap mengembalikan array 100 data terakhir (menjaga kompatibilitas mundur / *backward compatibility*).
2. **Frontend State & UI:**
   - Halaman `MonitoringScreen.js` mengelola state `page`, `pageSize = 5`, `totalPages`, dan `totalCount`.
   - Mengambil data melalui `Api.getSensorReadings(targetPage, pageSize)`.
   - Komponen kontrol pagination menyediakan:
     - Tombol **"Sebelumnya"** dengan event `fetchReadings(page - 1)`, otomatis berstatus `disabled` ketika `page <= 1`.
     - Teks informasi halaman aktif `"Halaman X dari Y"` dan badge total baris.
     - Tombol **"Berikutnya"** dengan event `fetchReadings(page + 1)`, otomatis berstatus `disabled` ketika `page >= totalPages`.
   - Alur penerimaan data MQTT melalui `useMqttSensor` tetap bekerja secara asinkron tanpa terputus ketika pengguna berpindah halaman.

### 3. Source Code yang Ditambahkan
**File:** `backend/src/models/readingsModel.js` (Kutipan Logika Pagination):
```javascript
export const ReadingsModel = {
  async list(page, limit) {
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const offset = (pageNum - 1) * limitNum;

      const countResult = await pool.query(
        `SELECT COUNT(*) AS total FROM public.sensor_readings`
      );
      const total = parseInt(countResult.rows[0]?.total || 0, 10);
      const totalPages = Math.max(1, Math.ceil(total / limitNum));

      const { rows } = await pool.query(
        `SELECT id, temperature, threshold_value, recorded_at
         FROM public.sensor_readings
         ORDER BY recorded_at DESC
         LIMIT $1 OFFSET $2`,
        [limitNum, offset]
      );
      return {
        data: rows.map(normalize),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      };
    }

    const { rows } = await pool.query(
      `SELECT id, temperature, threshold_value, recorded_at
       FROM public.sensor_readings
       ORDER BY recorded_at DESC
       LIMIT 100`
    );
    return rows.map(normalize);
  },
  // ...
};
```

**File:** `app/src/screens/MonitoringScreen.js` (Kutipan Kontrol Pagination):
```jsx
{/* Pagination Controls */}
<View style={styles.paginationCard}>
  <Pressable
    style={({ pressed }) => [
      styles.pageButton,
      page <= 1 && styles.pageButtonDisabled,
      pressed && page > 1 && styles.pageButtonPressed,
    ]}
    disabled={page <= 1 || loading}
    onPress={() => fetchReadings(page - 1)}
    accessibilityLabel="Halaman Sebelumnya"
  >
    <Ionicons name="chevron-back" size={16} color={page <= 1 ? color.text3 : color.primary} />
    <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
      Sebelumnya
    </Text>
  </Pressable>

  <View style={styles.pageInfo}>
    <Text style={styles.pageInfoText}>
      Halaman <Text style={styles.pageInfoBold}>{page}</Text> dari{" "}
      <Text style={styles.pageInfoBold}>{totalPages}</Text>
    </Text>
    {totalCount > 0 ? (
      <Text style={styles.pageSubText}>Total {totalCount} data</Text>
    ) : null}
  </View>

  <Pressable
    style={({ pressed }) => [
      styles.pageButton,
      page >= totalPages && styles.pageButtonDisabled,
      pressed && page < totalPages && styles.pageButtonPressed,
    ]}
    disabled={page >= totalPages || loading}
    onPress={() => fetchReadings(page + 1)}
    accessibilityLabel="Halaman Berikutnya"
  >
    <Text style={[styles.pageButtonText, page >= totalPages && styles.pageButtonTextDisabled]}>
      Berikutnya
    </Text>
    <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? color.text3 : color.primary} />
  </Pressable>
</View>
```

### 4. Screenshot Hasil Akhir
*Simpan file tangkapan layar pada:*  
- Halaman 1: `PPB-Modul6/documentation/screenshots/monitoring-page-1.png`  
- Halaman 2: `PPB-Modul6/documentation/screenshots/monitoring-page-2.png`  
- Tombol Sebelumnya Aktif: `PPB-Modul6/documentation/screenshots/monitoring-previous.png`  

![Monitoring Halaman 1](../screenshots/monitoring-page-1.png)  
![Monitoring Halaman 2](../screenshots/monitoring-page-2.png)

### 5. Analisis Hasil
Pengujian REST API membuktikan bahwa data halaman ke-1 (`OFFSET 0`) dan halaman ke-2 (`OFFSET 5`) menghasilkan record yang berbeda tanpa ada tumpang tindih data. Tombol "Sebelumnya" terkunci secara visual dan fungsional di halaman 1, dan tombol "Berikutnya" terkunci ketika indeks halaman mencapai `totalPages`. Pemisahan channel data antara polling REST API untuk tabel riwayat dan persistent WebSocket MQTT untuk temperature live memastikan UI selalu reaktif terhadap perubahan fisik suhu.

---

## 7.6.3 Halaman Profile

### 1. Tujuan
Menambahkan tab navigasi baru "Profile" pada React Navigation Bottom Tabs untuk menyajikan informasi resmi identitas Kelompok 10, data keempat anggota kelompok, program studi, universitas, serta spesifikasi arsitektur IoT dan basis data yang digunakan.

### 2. Penjelasan Implementasi
- Dibuat pada komponen `app/src/screens/ProfileScreen.js` dan diregistrasikan ke navigator tab di `app/App.js` dengan ikon tab `people` (Ionicons).
- Tata letak menggunakan *scrollable safe container* dengan palet warna selaras `tokens.js` (`#F8F9FB` background, `#FFFFFF` cards, `#0F172A` text, `#2563EB` primary).
- Komponen memuat kartu header identitas kelompok, badge kelompok, daftar kartu anggota berisi nama lengkap, NIM, avatar inisial (*circle badge*), urutan anggota, serta kartu metadata sistem yang menampilkan informasi framework, koneksi database Neon PostgreSQL, dan topik MQTT Kelompok 10 (`ppb/kel10/iot/temperature`).
- Animasi bertingkat (*staggered entrance*) diimplementasikan menggunakan `FadeInDown.duration().delay(index * 60)` dari Reanimated untuk menciptakan visual yang elegan saat tab dibuka.

### 3. Source Code yang Ditambahkan
**File:** `app/src/screens/ProfileScreen.js` (Kutipan Struktur Data & Tampilan):
```javascript
const MEMBERS = [
  { name: "Anindya Fairuz Az Zahra", nim: "21120124120018", initials: "AZ" },
  { name: "Farrel Satya Lukito", nim: "21120124140111", initials: "FL" },
  { name: "Yunita Dwi Ardilasari", nim: "21120124120001", initials: "YA" },
  { name: "Amirah Rahmah Wijayanti", nim: "21120124130068", initials: "AW" },
];

export function ProfileScreen() {
  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={styles.headerCard} entering={FadeInDown.duration(tokens.motion.entering)}>
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={16} color={color.primary} />
            <Text style={styles.groupBadgeText}>KELOMPOK 10</Text>
          </View>
          <Text style={styles.headerTitle}>Praktikum PPB 2026</Text>
        </Animated.View>

        {MEMBERS.map((member, index) => (
          <Animated.View
            key={member.nim}
            style={styles.memberCard}
            entering={FadeInDown.duration(tokens.motion.entering).delay(index * 60)}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{member.initials}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.nimText}>NIM: {member.nim}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
```

### 4. Screenshot Hasil Akhir
*Simpan file tangkapan layar pada:* `PPB-Modul6/documentation/screenshots/profile.png`  
![Profile Screen](../screenshots/profile.png)

### 5. Analisis Hasil
Penambahan tab Profile berhasil memperluas fungsionalitas navigasi aplikasi tanpa mengganggu state pada layar `Monitoring` maupun `Control`. Alur navigasi Bottom Tabs merespons pergantian tab secara instan, dan seluruh identitas anggota Kelompok 10 tertampil dengan tipografi yang jelas, rapi, serta konsisten dengan bahasa desain *LiveTemp*.

---

## 7.6.4 UI Animation Sphere

### 1. Tujuan
Memodifikasi komponen animasi bola 3D (`TempOrb.js`) pada halaman Monitoring agar memiliki tampilan futuristik, bernuansa IoT telemetry, memiliki kedalaman visual yang tinggi (*luminous glow & multi-layered aura*), berdenyut dinamis mengikuti perubahan suhu, namun tetap mempertahankan performa rendering 60 FPS dan fungsionalitas keterbacaan angka temperatur di area tengah.

### 2. Penjelasan Desain Sphere & Animasi
1. **Multi-layer Glowing Photon Texture:**
   - Pada tekstur partikel Skia (`dotPicture`), pembuatan titik diubah dari lingkaran solid putih polos menjadi partikel foton 3 lapisan:
     - Lapisan Luar: Soft aura dengan radius penuh `(TEX / 2 - 1)` dan warna semi-transparan `rgba(255, 255, 255, 0.35)`.
     - Lapisan Tengah: Energy corona dengan radius `65%` dan warna `rgba(255, 255, 255, 0.75)`.
     - Lapisan Inti: Solid core berenergi tinggi berwarna putih murni `white` pada radius `35%`.
   - Hasilnya, bola tampak berpendar (*bloom glow*) layaknya bola plasma digital.
2. **Organic Digital Plasma Wave Pulsation:**
   - Dalam worklet `transforms`, ditambahkan modulasi gelombang matematis:
     `const wave = Math.sin(a * 2.5 + p[1] * 4) * 0.04 * (1 + intensity.value * 0.4);`
     `const swell = (1 + 0.05 * intensity.value) * (1 + wave);`
   - Modulasi ini menciptakan efek permukaan bola yang berdenyut elastis secara berkesinambungan saat berotasi.
3. **Smooth Aperture Transition (Center Hole):**
   - Agar titik-titik di sekitar lubang nilai suhu tidak terpotong kasar (*sharp clipping*), dibuat fungsi interpolasi skala:
     `const fadeFactor = Math.min(1, (Math.sqrt(distSq) - HOLE_RADIUS) / 14);`
   - Partikel mengecil secara proporsional saat mendekati batas apertur suhu.
4. **Dynamic Ambient Telemetry Aura Rings:**
   - Di belakang kanvas Skia, dipasang dua ring konsentris (*outer dashed ring* dan *inner solid ring*) yang warnanya tersinkronisasi otomatis dengan status ambang batas (*Normal: Hijau, Near limit: Kuning, Over limit: Merah*).

### 3. Source Code yang Ditambahkan
**File:** `app/src/components/TempOrb.js` (Kutipan Modifikasi Utama):
```javascript
// Multi-layer glowing particle texture
const dotPicture = useMemo(() => {
  try {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(rect(0, 0, TEX, TEX));

    // Outer soft aura
    const auraPaint = Skia.Paint();
    auraPaint.setAntiAlias(true);
    auraPaint.setColor(Skia.Color("rgba(255, 255, 255, 0.35)"));
    canvas.drawCircle(TEX / 2, TEX / 2, TEX / 2 - 1, auraPaint);

    // Mid energy corona
    const midPaint = Skia.Paint();
    midPaint.setAntiAlias(true);
    midPaint.setColor(Skia.Color("rgba(255, 255, 255, 0.75)"));
    canvas.drawCircle(TEX / 2, TEX / 2, (TEX / 2) * 0.65, midPaint);

    // Bright solid core
    const corePaint = Skia.Paint();
    corePaint.setAntiAlias(true);
    corePaint.setColor(Skia.Color("white"));
    canvas.drawCircle(TEX / 2, TEX / 2, (TEX / 2) * 0.35, corePaint);

    return recorder.finishRecordingAsPicture();
  } catch {
    return null;
  }
}, []);

// Dalam useRSXformBuffer:
const wave = Math.sin(a * 2.5 + p[1] * 4) * 0.04 * (1 + intensity.value * 0.4);
const swell = (1 + 0.05 * intensity.value) * (1 + wave);
const rr = R * swell;
// Soft aperture fade
const fadeFactor = Math.min(1, (Math.sqrt(distSq) - HOLE_RADIUS) / 14);
const sc = 0.24 * (0.65 + 0.75 * depth) * swell * fadeFactor;
```

### 4. Screenshot Home Screen
*Simpan file tangkapan layar pada:* `PPB-Modul6/documentation/screenshots/home-screen.png`  
![Home Screen](../screenshots/home-screen.png)

### 5. Analisis Hasil
Penggunaan `@shopify/react-native-skia` dipadukan dengan Worklets dari `react-native-reanimated` memungkinkan seluruh transformasi koordinat 240 titik Fibonacci dan proyeksi 3D dieksekusi secara native pada UI thread. Efek pendaran partikel (*photon glow*) dan modulasi gelombang permukaan berhasil mewujudkan estetika futuristik bertema IoT tanpa menyebabkan penurunan performa rendering, sekaligus menjaga teks suhu di tengah tetap terbaca dengan jelas.

---

## Kesimpulan

11.	Penggunaan React Native bersama framework Expo mempermudah dan mempercepat proses pembuatan serta pengujian aplikasi mobile lintas platform melalui satu basis kode (single codebase) yang dapat dijalankan langsung pada perangkat fisik menggunakan aplikasi Expo Go.
2.	Integrasi protokol MQTT berbasis WebSocket memungkinkan aplikasi menerima dan menampilkan data suhu dari perangkat IoT secara waktu nyata (real-time) dan ringan melalui mekanisme publish-subscribe pada topik yang telah disesuaikan.
3.	 Backend berbasis Node.js berhasil menghubungkan antarmuka aplikasi mobile dengan server menggunakan RESTful API, sehingga pengiriman dan pengambilan data konfigurasi maupun riwayat sensor dapat berjalan secara terstruktur dalam satu jaringan lokal (LAN).
4.	Layanan Neon Database (PostgreSQL) efektif digunakan sebagai media penyimpanan persisten untuk mencatat riwayat pembacaan suhu pada tabel sensor_readings serta menyimpan pengaturan nilai ambang batas pada tabel threshold_settings.
5.	Halaman Monitoring dan Control saling terintegrasi secara fungsional, di mana perubahan nilai batas suhu (threshold) yang disimpan pada halaman Control langsung menjadi acuan bagi sistem dalam mengevaluasi dan menampilkan status kondisi suhu pada halaman Monitoring. 


---

## Lampiran

- **Link Repository GitHub:***
- **Link Video Demo Singkat:** **
