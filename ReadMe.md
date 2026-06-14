# frontendui-Exam (monorepo)

Monorepo pro frontendové aplikace postavené na **React + Vite**. Repo používá **npm workspaces** a obsahuje:
- `apps/*` – spustitelné aplikace (Vite dev server / build)
- `packages/*` – sdílené balíčky (UI/template, dynamic store, GQL sdílené věci a doménové moduly)

V této repozitáři je pro zkoušku/ukázku důležitá aplikace:

- **`@nik-kb-sp/app_exam`** (adresář `apps/app_exam`) – UI nad GraphQL endpointem, používá routing a sdílené komponenty/balíčky z `packages/*`.

## Požadavky

- Node.js + npm (doporučeno aktuální LTS)
- (Volitelně) Docker + Docker Compose pro lokální backend stack

## Struktura repozitáře (zkráceně)

```
root/
├── apps/
│   ├── app_exam/              # @nik-kb-sp/app_exam (Vite + React)
│   ├── app_dynamic/
│   ├── app_admissions/
│   └── ...
├── packages/
│   ├── exam/                  # @nik-kb-sp/pck_exam (routes/pages pro Exam sekci)
│   ├── _template/             # Shared template komponenty a layout
│   ├── dynamic/               # Dynamic store
│   ├── shared/                # Sdílené utility
│   ├── gql_shared/            # Sdílené GraphQL věci
│   └── ...
├── docker-compose.yml         # Lokální stack (frontend, Apollo federation, GQL služby, Postgres)
└── package.json               # Root workspace konfigurace
```

## Instalace

V rootu monorepa:

```bash
npm install
```

Repo používá npm workspaces (`apps/*`, `packages/*`), takže instalace se dělá z rootu.

## Spuštění aplikace `@nik-kb-sp/app_exam`

Z rootu monorepa spusť dev server workspacu:

```bash
npm run dev -w @nik-kb-sp/app_exam
```

Aplikace běží jako Vite projekt. V konfiguraci má:
- GraphQL endpoint v aplikaci defaultně nastavený na `"/api/gql"`
- dev proxy: požadavky na `/api/gql` se proxyují na `http://localhost:33001`

> Pozn.: Pokud ti na pozadí neběží služba na `localhost:33001`, GraphQL volání nebudou fungovat.

## Backend / API (Docker Compose)

Repo obsahuje `docker-compose.yml`, který zvedá služby potřebné pro GraphQL:
- `frontend` (port mapovaný na `33001:8000`)
- `apollo` (federation gateway)
- více `gql_*` služeb (ug/office/granting/admissions)
- databáze `postgres_*` + `pgadmin`

Spuštění stacku:

```bash
docker compose up -d
```

Potom znovu spusť frontend aplikaci:

```bash
npm run dev -w @nik-kb-sp/app_exam
```

## Build (produkční sestavení) pro `@nik-kb-sp/app_exam`

```bash
npm run build -w @nik-kb-sp/app_exam
```

## Užitočné root skripty

V root `package.json` jsou mimo jiné:
- `npm run build:apps` – build všech apps ve workspaces (`apps/*`)
- generátory/utility skripty (např. `create:component`, `create:filter`, …)

## Poznámky k implementaci `app_exam`

- Vstup aplikace je `apps/app_exam/src/main.jsx`, který renderuje `<App />`.
- `<App />` obaluje router do `RootProviders` (store / klient) a používá endpoint `"/api/gql"`.
- Routing (`AppRouter`) skládá stránky z:
  - `packages/exam/src/ExamGQLModel/Pages/RouterSegment` (Exam sekce)
  - `packages/_template/src/Base/Pages/RouterSegment` (základní stránky / layout)
- Vite konfigurace je monorepo-friendly (aliasy do `packages/*` a `preserveSymlinks: true`).

---

## Vývoj a Changelog

### Posloupnost commitů (od nejnovějšího)

#### 1. 6. 2026
**Commit:** `7d73a6b312d460fd6aeefad44cb0a59643b633e0`
- **Autor:** NikiHal013
- **Zpráva:** "Enhance Exam Parts functionality with inline editing and additional fields"
- **Změny:** Vylepšení funkcionalitu EditInline pro Exam Parts, přidání dodatečných polí pro reprezentaci dat a jejich úprava.
- **Status:** ✅ Implementováno

**Commit:** `f2c135fbd9a2e866e2325313cd7fb69439b8105e`
- **Autor:** DusanRepan
- **Zpráva:** "Fix exam part creation and async insert actions"
- **Změny:**
  - Oprava vytváření nových Exam Parts
  - Oprava asynchronních GraphQL insert akcí
  - Stabilizace ukládání nově vytvořených záznamů
- **Status:** ✅ Implementováno

**Commit:** `2bd6e5318498c69b9a3cb34f518d6182afd504f5`
- **Autor:** DusanRepan
- **Zpráva:** "improve exam parts deletion functionality"
- **Změny:**
  - Vylepšení mazání Exam Parts
  - Oprava logiky odstranění navázaných položek
  - Lepší synchronizace UI po smazání záznamu
- **Status:** ✅ Implementováno

**Commit:** `b587294275df999edb0543a7e432c59018ca6438`
- **Autor:** DusanRepan
- **Zpráva:** "add unlink plan functionality and enhance exam part management"
- **Změny:**
  - Přidána možnost odpojení (unlink) Classification Planu
  - Rozšířena správa Exam Parts
  - Úpravy GraphQL operací souvisejících s vazbami mezi entitami
- **Status:** ✅ Implementováno

**Commit:** `f2c135fbd9a2e866e2325313cd7fb69439b8105e`
- **Autor:** DusanRepan
- **Zpráva:** "clean up rendering logic for score attributes in MediumContent"
- **Změny:**
  - Vyčištění renderovací logiky komponenty MediumContent
  - Úprava zobrazování bodových atributů (score attributes)
  - Zlepšení čitelnosti a udržovatelnosti kódu
- **Status:** ✅ Implementováno

#### 31. 5. 2026
**Commit:** `2b3a09ed2bbf2e1ac41e81b9f50e2fc4c0b0f216`
- **Autor:** DusanRepan
- **Zpráva:** "patch part 3"
- **Změny:** Opravy v Part 3
- **Status:** ✅ Implementováno

**Commit:** `a7f5dfaeea757f054746af438793ff86175f4b49`
- **Autor:** DusanRepan
- **Zpráva:** "patch part 2"
- **Změny:** Opravy v Part 2
- **Status:** ✅ Implementováno

**Commit:** `c49edf98aad3095550acce2151cc712434f4b986`
- **Autor:** DusanRepan
- **Zpráva:** "parts_patch"
- **Změny:** Obecné opravy pro parts
- **Status:** ✅ Implementováno

#### 28. 5. 2026
**Commit:** `2d6cf95c8caf3cd8028811c0c2952a4f500ac866`
- **Autor:** DusanRepan
- **Zpráva:** "admin+useEdit"
- **Změny:** Přidání admin funkcionality a useEdit hook/komponenty
- **Status:** ✅ Implementováno

#### 13. 5. 2026
**Commit:** `fb2f77b0a7453bd0bb17c3beacf381171e20e660`
- **Autor:** DusanRepan
- **Zpráva:** "update package pro příště, bacha"
- **Změny:** Aktualizace balíčků, poznámka o budoucích změnách
- **Status:** ✅ Implementováno

**Commit:** `5d11c94a63508a2272b363c41e234c6c371f496c`
- **Autor:** DusanRepan
- **Zpráva:** "package-update"
- **Změny:** Aktualizace npm balíčků
- **Status:** ✅ Implementováno

#### 11. 5. 2026
**Commit:** `50a85065056babd1d3dc9856f661008573ccf40c`
- **Autor:** NikiHal013
- **Zpráva:** "Enhance MediumContent and MediumEditableContent components with additional attributes and labels"
- **Změny:** 
  - Vylepšení MediumContent a MediumEditableContent komponent
  - Přidání atributů a nálepek pro lepší reprezentaci dat
- **Status:** ✅ Implementováno

#### 7. 5. 2026
**Commit:** `b837750cee295f5840f3f5971c42d8111bab5c90`
- **Autor:** velkayolanda
- **Zpráva:** "Update exam-related mutations and validation in forms for improved functionality"
- **Změny:**
  - Aktualizace exam mutations
  - Vylepšení validace ve formulářích
- **Status:** ✅ Implementováno

**Commit:** `9c98b46a8f44786a4c15edce99b53cf5c326ec89`
- **Autor:** DusanRepan
- **Zpráva:** "formatovani examedit..."
- **Změny:** Formátování Exam Edit sekcí
- **Status:** ✅ Implementováno

**Commit:** `cd741bc056ca7375487077c0d24792f54b3eb695`
- **Autor:** DusanRepan
- **Zpráva:** "opravy pridat part protoze nekdo neviii kde to je"
- **Změny:** Opravy a přidání Part sekcí s vylepšenou UX
- **Status:** ✅ Implementováno

**Commit:** `d4ccbe8c21880059feb27cdd0d7a17db6c523fe1`
- **Autor:** DusanRepan
- **Zpráva:** "revert _template"
- **Změny:** Vrácení _template balíčku do původního stavu
- **Status:** ✅ Implementováno

**Commit:** `d9ae58800a6b5b558e85fc17d18a3c06a7f2bd17`
- **Autor:** DusanRepan
- **Zpráva:** "zmeny bez funkcniho graphQL"
- **Změny:** Změny bez plně funkčního GraphQL (preparace)
- **Status:** ⚠️ Dočasné řešení

#### 6. 5. 2026
**Commit:** `5a0a9225442296175ea40bb49939d412cb35acf6`
- **Autor:** NikiHal013
- **Zpráva:** "Refactor components and update mutation logic for improved functionality and user experience"
- **Změny:**
  - Refaktoring komponent
  - Aktualizace mutation logiky
  - Zlepšení funkcionality a UX
- **Status:** ✅ Implementováno

#### 28. 4. 2026
**Commit:** `81404511cd84c0e9843026506f63756645097c92`
- **Autor:** NikiHal013
- **Zpráva:** "konzultace"
- **Status:** ℹ️ Konzultační bod

**Commit:** `d95c4bb8746add5558427274a7ab897fc08ee9b9`
- **Autor:** DusanRepan
- **Zpráva:** "priprava na novou verziu"
- **Změny:** Příprava na novou verzi
- **Status:** ✅ Implementováno

**Commit:** `85733aa78e9bec0f65a6d731306d50ce23364473`
- **Autor:** DusanRepan
- **Zpráva:** "publish changes for public"
- **Změny:** Publikování změn pro veřejnost
- **Status:** ✅ Implementováno

**Commit:** `bf10cbe9d9bbc225e186b73f44b8661b54abff0c`
- **Autor:** DusanRepan
- **Zpráva:** "npm lock change"
- **Změny:** Změna package-lock.json
- **Status:** ✅ Implementováno

**Commit:** `2a67c7c7d23106df8062cc3bcd6de853a6c3a33f`
- **Autor:** DusanRepan
- **Zpráva:** "new version setup"
- **Změny:** Nastavení nové verze
- **Status:** ✅ Implementováno

**Commit:** `cbd8c1ecc08f7958c4774004f52ddf4a1336f971`
- **Autor:** DusanRepan
- **Zpráva:** "package version update"
- **Změny:** Aktualizace verzí balíčků
- **Status:** ✅ Implementováno

---

## Analýza a Zjištění

### Identifikované problémy a jejich řešení

#### 1. **Parts Struktura a UX** ✅
- **Problém:** Nejasnost v umístění Parts sekcí, nedostatečná dokumentace
- **Zjištěno:** Commit `cd741bc056ca7375487077c0d24792f54b3eb695`
- **Řešení:** 
  - Vylepšení struktury Parts
  - Přidání inline editing (commit 1. 6. 2026)
  - Přidání editovacích komponent
- **Výsledek:** ✅ Vyřešeno

#### 2. **Package Management** ⚠️
- **Problém:** Problémy s npm dependency verzemi
- **Zjištěno:** Seria commitů 13. 5. 2026 (fb2f77b0, 5d11c94a)
- **Řešení:**
  - Aktualizace balíčků
  - Refresh package-lock.json
  - Komunikace o budoucích změnách
- **Výsledek:** ⚠️ Částečně vyřešeno, vyžaduje pozornost

#### 3. **GraphQL Integrace bez úplné funkcionality** ⚠️
- **Problém:** Commit `d9ae58800a6b5b558e85fc17d18a3c06a7f2bd17` popisuje "zmeny bez funkcniho graphQL"
- **Zjištěno:** 7. 5. 2026
- **Řešení:**
  - Postupné opravy a patchs (Part 1, 2, 3)
  - Aktualizace mutations a validace (commit b837750c)
  - Refaktoring komponenty (commit 5a0a922)
- **Výsledek:** ✅ Postupně vyřešeno

#### 4. **Komponenty MediumContent** ✅
- **Problém:** Nedostatečné atributy a metadat
- **Zjištěno:** 11. 5. 2026
- **Řešení:** Přidání dodatečných atributů a nálepek (commit 50a8506)
- **Výsledek:** ✅ Vyřešeno

#### 5. **Mutations a Validace Formulářů** ✅
- **Problém:** Neúplná či chybná validace
- **Zjištěno:** 7. 5. 2026
- **Řešení:** Aktualizace exam mutations a validace (commit b837750c)
- **Výsledek:** ✅ Vyřešeno

### Co se Objevilo a Bylo Vyřešeno

| Téma | Datum | Commit | Status |
|------|-------|--------|--------|
| Admin + useEdit Hook | 28. 5. | 2d6cf95c | ✅ |
| Parts Inline Editing | 1. 6. | 7d73a6b3 | ✅ |
| MediumContent Enhancement | 11. 5. | 50a8506 | ✅ |
| Exam Mutations/Validation | 7. 5. | b837750c | ✅ |
| Component Refactoring | 6. 5. | 5a0a922 | ✅ |

---

## Otevřené Otázky a Problémy

### Problémy, které se stále řeší

#### 1. **Package Dependencies na Dlouhodobou Dobu**
- **Popis:** Některé dependencies mohou mít problémy s kompatibilitou
- **Poznámka z kódu:** "update package pro příště, bacha" (commit fb2f77b0)
- **Doporučení:** Pravidelně kontrolovat kompatibilitu a updatovat

#### 2. **GraphQL Endpoint Stabilita**
- **Popis:** Dev proxy na `http://localhost:33001` musí běžet bez přerušení. Tenhle error se musí opravit zároveň s mazáním dat
- **Řešení:** Zajistit běh Docker stacku, viz sekce Backend / API - vyžaduje to restart
- **Status:** Vyžaduje monitoring

#### 3. **_template Balíček Stabilita**
- **Popis:** Byl proveden revert (commit d4ccbe8c), signalizuje potenciální problémy
- **Řešení:** Vyžaduje pečlivou review a testing při změnách
- **Status:** K monitorování

#### 4. Ukládání a editace Exam Parts
- **Popis:** Při vytváření a editaci Exam Parts se stále objevují problémy s ukládáním dat.
- **Projevy:**
  - Nekonečný loading.
  - Opakované GraphQL requesty bez dokončení operace.
  - Neuložení změn i přes zobrazený stav načítání.
  - Nekonzistentní synchronizace mezi frontendem a backendem.
- **Dosavadní kroky:**
  - Úprava async insert akcí.
  - Opravy logiky vytváření Exam Parts.
  - Testování správy stavu komponent a GraphQL mutation.
- **Aktuální stav:** ⚠️ Problém přetrvává a probíhá testování a ladění nové verze.

#### 5. Mazání Exam Parts
- **Popis:** Mazání Exam Parts není ve všech případech spolehlivé.
- **Projevy:**
  - Položka může zůstat zobrazená i po smazání.
  - Nutnost obnovení stránky pro synchronizaci dat.
  - Občasné chyby při komunikaci s backendem.
- **Dosavadní kroky:**
  - Úprava delete funkcionality.
  - Testování obnovy dat po odstranění záznamu.
- **Aktuální stav:** ⚠️ Probíhá testování a ladění.

### Sekce pro Doplnění

### Další problémy, které se nedaří vyřešit:**
- Mazání a problém v dockeru
- Nesprávné zobrazení MIN počtu bodů v MediumContents při vytvoření nové subparty
- Propojení s Evaluation a StudyPlan

### Co jsme objevili:
- Správná nebo lepší práce s backendem
- Většina věcí je řešitelná pomocí už existujících templatů

---

## Historické Verze

### 13. 4. 2026
- Aktualizace `ReadMe.md` – doplnění popisu monorepa (apps/packages)
- Doplnění požadavků, instalace a spuštění `@nik-kb-sp/app_exam` přes `npm run dev -w @nik-kb-sp/app_exam`
- Poznámky k backendu (Docker Compose, proxy `/api/gql` → `http://localhost:33001`)
- Technické poznámky k implementaci `app_exam`

### 9. 4. 2026
- Změna kořenové URI pro „exam" modul: `URIRoot` z `"/project1"` na `"/exam"` (`packages/exam/src/uriroot.js`)
- Přejmenování balíčků v monorepu (`@nik-kb-sp/pck_project1` → `@nik-kb-sp/pck_exam`)
- Úpravy v `package-lock.json`

### 9. 4. 2026
- První velký commit aplikace a balíčku

---

## Kontakty a Reference

- **Repository:** [NikiHal013/frontendui-Exam](https://github.com/NikiHal013/frontendui-Exam)
- **Vývojáři:** NikiHal013, DusanRepan
- **Poslední aktualizace:** 1. 6. 2026
