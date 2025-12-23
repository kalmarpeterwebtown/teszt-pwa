# TMS - Task Management System

Modern PWA alkalmazás felhasználókezeléshez, offline támogatással.

## Funkciók

### Felhasználókezelés (V1)
- Felhasználók listázása, keresése, szűrése szerepkör szerint
- Felhasználó részletek megtekintése
- Felhasználók létrehozása és szerkesztése (jogosultságok alapján)
- Kompetenciák hozzárendelése (autocomplete)
- Munkarend kezelése (munkaidő, szabadságok)

### Szerepkörök és jogosultságok
- **Admin**: Mindent láthat/szerkeszthet, vezető szerepköröket is létrehozhat
- **Osztályvezető**: Csoportvezető/Munkatárs/Megtekintő létrehozása
- **Csoportvezető**: Munkatárs/Megtekintő létrehozása
- **Munkatárs**: Csak megtekintés
- **Megtekintő**: Csak megtekintés

### Kompetencia katalógus
- Admin által kezelhető kompetencia lista
- Kategorizálás támogatása
- CRUD műveletek

### PWA és Offline támogatás
- Service Worker automatikus frissítéssel
- IndexedDB adattárolás
- Offline módban is működik a teljes felhasználókezelés
- Online/Offline státusz indikátor

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Storage**: IndexedDB (idb)
- **PWA**: vite-plugin-pwa + Workbox
- **Icons**: Heroicons
- **Routing**: React Router v6
- **Notifications**: React Hot Toast

## Telepítés és futtatás

```bash
# Függőségek telepítése
npm install --include=dev

# Fejlesztői szerver indítása
npm run dev

# Production build
npm run build

# Build előnézet
npm run preview
```

## GitHub Pages deployment

```bash
# Build és deploy
npm run deploy
```

Az alkalmazás elérhető: https://kalmarpeterwebtown.github.io/teszt-pwa/

## PWA telepítés

1. Nyisd meg az alkalmazást Chrome-ban
2. Kattints a címsor melletti "Telepítés" ikonra
3. Vagy: Menü → "Alkalmazás telepítése"

## Demo adatok

Az első betöltéskor automatikusan létrejönnek demo felhasználók és kompetenciák.
A bejelentkezési képernyőn a "Demo adatok újratöltése" gombbal visszaállíthatók az eredeti adatok.

### Demo felhasználók
- **Admin Béla** (Admin) - teljes hozzáférés
- **Nagy István** (Osztályvezető)
- **Kiss Katalin** (Csoportvezető)
- **Tóth Péter** (Munkatárs)
- **Szabó Anna** (Munkatárs)
- **Kovács Gábor** (Megtekintő)

## Mappastruktúra

```
src/
├── components/
│   ├── layout/         # Layout komponensek (Sidebar, Header)
│   └── ui/             # UI komponensek (Button, Input, Modal, stb.)
├── hooks/              # Custom React hooks
├── pages/
│   ├── users/          # Felhasználó oldalak
│   ├── competencies/   # Kompetencia katalógus
│   ├── schedule/       # Munkarend kezelés
│   └── placeholders/   # Placeholder oldalak
├── services/           # Adatbázis és üzleti logika
├── stores/             # Zustand store-ok
└── types/              # TypeScript típusok
```

## Jövőbeli modulok (Coming Soon)

- Projektek
- Feladatok
- KPI-ok
- Erőforrás tervezés
- Munkaidő könyvelés
- Értesítések
- Dashboardok
- Reportok
- Exportok

## Licensz

MIT
