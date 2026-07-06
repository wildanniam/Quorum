# Quorum Development Handoff

Last updated: 2026-07-06

Dokumen ini dibuat untuk menyamakan konteks development Quorum. Tujuannya bukan
membuat roadmap per hari, tetapi menjelaskan posisi project sekarang, keputusan
produk/teknis yang sudah disepakati, bagian yang belum selesai, dan PR besar
yang perlu dikerjakan berikutnya.

## Ringkasan Produk

Quorum bukan sekadar aplikasi ticketing event.

Positioning yang sekarang dipakai:

> Quorum adalah Stellar-powered settlement layer untuk paid community events.
> Quorum membantu event menerima pembayaran, menerbitkan pass, membagi revenue
> ke collaborator, mencatat ledger, memberi bukti transaksi, dan menyiapkan
> payout/off-ramp lewat anchor seperti MoneyGram.

Masalah yang ingin diselesaikan bukan "platform seperti Luma tidak transparan".
Itu terlalu lemah dan kurang akurat. Problem yang lebih tepat:

> Paid community events sering punya banyak pihak: organizer, speaker, venue,
> komunitas, sponsor, atau partner. Tapi pembagian uang antar pihak biasanya
> masih manual, sulit diverifikasi, dan bergantung pada screenshot/dashboard
> milik host. Quorum membuat settlement event menjadi bisa dicek, dibuktikan,
> dan siap dicairkan lewat ekosistem Stellar.

Jadi Quorum harus terasa seperti produk event yang enak dipakai, tetapi nilai
uniknya ada di settlement, proof, ledger, dan payout.

## Posisi Development Sekarang

Status project saat ini:

- Frontend sudah pernah dipoles/redesign dan sudah jauh lebih layak dibanding
  versi awal.
- Wallet integration sekarang masih Freighter-only.
- Smart contract foundation dan testnet deployment evidence sudah ada.
- Flow utama seperti event publish, checkout, pass, check-in, dan withdraw
  sudah punya fondasi lokal/contract-ready.
- App sudah dimigrasikan dari SQLite lokal ke Postgres/Supabase-ready
  persistence lewat `pg`.
- Supabase/Postgres migration sudah masuk ke `main`, tetapi hosted Supabase
  project, Vercel env, dan live hosted verification tetap perlu disiapkan.
- Live Transaction Evidence Page belum ada sebagai halaman produk.
- Soroban Event Indexer belum ada.
- Anchor/MoneyGram belum terintegrasi.
- Receipt belum proper sebagai fitur produk.
- Collaborator ledger belum proper sebagai fitur produk.
- QR/check-in sudah ada pondasi, tetapi masih perlu dipoles.
- Real hosted Freighter-signed live app-flow evidence belum final.

Dokumen teknis yang sudah ada dan penting untuk dibaca:

- `README.md`
- `TODO.md`
- `docs/MVP_READINESS.md`
- `docs/PRODUCTION_ENV_HANDOFF.md`
- `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md`
- `docs/FRONTEND_REDESIGN.md`

## Keputusan Yang Sudah Di-lock

Bagian ini sudah disepakati dan sebaiknya tidak dibuka ulang kecuali ada alasan
kuat.

### Product Direction

- Quorum diposisikan sebagai settlement/proof layer untuk paid community events.
- Jangan memposisikan Quorum hanya sebagai NFT ticketing.
- Jangan menyerang Luma/Eventbrite dengan klaim "mereka tidak transparan".
  Narasinya harus lebih spesifik: Quorum unggul di verifiable multi-party
  settlement, collaborator ledger, dan anchor-ready payout.

### Storage

- Supabase dipakai sebagai database production/handoff melalui Postgres
  server-side access.
- Jangan expose Supabase service-role key, database password, atau Postgres URL
  ke browser.
- Jangan tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` kecuali nanti memang ada desain frontend
  Supabase client + RLS.
- Jangan mengembalikan code ke SQLite/local file DB. Current baseline sudah
  menggunakan Postgres driver dan async repository flow.

### Evidence Page

- Quorum perlu Live Transaction Evidence Page.
- Evidence page bukan pengganti Stellar Explorer.
- Evidence page adalah halaman bukti milik Quorum yang menampilkan transaksi
  Quorum dan memberi link ke Stellar Explorer.
- Data transaksi disimpan semua di database, tapi tampilan dipisah berdasarkan
  konteks:
  - global/demo evidence untuk judge atau public proof;
  - event evidence untuk transaksi satu event;
  - receipt/pass proof untuk buyer;
  - collaborator ledger untuk collaborator;
  - organizer dashboard untuk organizer event.
- Judge tidak perlu role khusus. Judge cukup diberi public/demo evidence page
  yang aman untuk dibuka publik.

### Access Model

- Jangan membuat banyak tipe user permanen.
- Hak akses dihitung dari hubungan wallet ke event.
- Satu wallet bisa menjadi organizer di event A, collaborator di event B, dan
  attendee di event C.
- Role minimum:
  - public viewer;
  - connected wallet;
  - internal admin/dev jika benar-benar perlu.
- Setelah wallet connect, server mengecek:
  - apakah wallet adalah organizer event;
  - apakah wallet adalah collaborator dalam split event;
  - apakah wallet memiliki pass/purchase;
  - jika tidak ada hubungan, hanya lihat public evidence.

### Indexer

- Quorum akan memakai custom Soroban Event Indexer.
- Indexer adalah backend/data infrastructure, bukan fitur UI langsung.
- UI tetap merasakan manfaatnya karena evidence page, receipt, ledger, dan
  dashboard bisa membaca data yang sudah disimpan di database.
- Indexer membaca event dari Stellar RPC `getEvents`, memfilter contract
  Quorum, lalu menyimpan event ke Supabase/Postgres.
- Untuk hackathon/testnet, custom indexer cukup dan tidak perlu provider indexer
  berbayar dulu.

### Anchor / MoneyGram

- Arah produk anchor adalah MoneyGram-compatible payout/off-ramp.
- Jangan overclaim bahwa production cash-out sudah berjalan kalau belum ada
  approval/compliance production.
- Target yang aman untuk hackathon:
  - MoneyGram-compatible architecture;
  - anchor payout state di database;
  - domain + `stellar.toml` siap;
  - sandbox/mock fallback;
  - jika MoneyGram allowlist siap, sambungkan ke sandbox beneran.
- Quorum sebaiknya punya anchor provider abstraction supaya tidak terkunci
  permanen ke satu provider.
- Provider pertama tetap diarahkan ke MoneyGram.

### Payout

- Demo payout bisa dilakukan di testnet/sandbox.
- Real cash-out ke uang dunia nyata membutuhkan production/mainnet, partner
  access, dan compliance.
- KYC tidak perlu dibangun sendiri oleh Quorum pada MVP. Dalam flow anchor,
  KYC sebaiknya ditangani oleh anchor/provider.
- Quorum cukup menyimpan payout request, status, reference ID, dan proof yang
  aman untuk disimpan.

### Wallet

- Freighter-only cukup untuk sekarang.
- Stellar Wallet Kit bagus, tapi ditunda sampai core proof stabil.
- Alasan menunda Stellar Wallet Kit:
  - prioritas lebih penting adalah Supabase, indexer, evidence, ledger,
    receipt, dan anchor-ready payout;
  - migrasi wallet kit perlu retest semua signing flow;
  - ada risiko scope melebar.

### QR / Check-in

- QR/check-in masuk roadmap.
- Saat ini pondasinya sudah ada, tetapi perlu dipoles agar UX-nya terasa sebagai
  fitur produk, bukan sekadar helper teknis.

### Ditunda

- Escrow/refund/cancellation ditunda.
- Multi-wallet lewat Stellar Wallet Kit ditunda sampai core stabil.

## Open Decisions Yang Masih Perlu Di-lock

Bagian ini belum final. Rekomendasi sudah ada, tapi sebaiknya diputuskan
sebelum development besar dimulai.

### 1. Indexer Jalan Di Mana?

Rekomendasi: Vercel Cron.

Alasan:

- project kemungkinan deploy di Vercel;
- cron dekat dengan app runtime;
- cukup simpel untuk hackathon;
- tidak perlu server terpisah.

Alternatif:

- Supabase Edge Function + Scheduler jika backend ingin lebih dekat ke Supabase.
- GitHub Actions cron untuk solusi cepat, tetapi kurang production-like.

Keputusan yang perlu diambil:

> Pakai Vercel Cron atau Supabase Scheduler?

Rekomendasi lock:

> Pakai Vercel Cron dulu. Kalau nanti Supabase Edge Function terasa lebih pas,
> baru dipindah.

### 2. Receipt Dipisah Atau Digabung Dengan Pass Page?

Rekomendasi: gabung dulu di pass detail.

Alasan:

- lebih cepat;
- user natural melihat pass + receipt + proof di satu tempat;
- tidak perlu route baru terlalu banyak;
- bisa tetap dibuat terlihat seperti receipt profesional.

Keputusan yang perlu diambil:

> Receipt final ada di `/passes/[tokenId]` atau route baru
> `/receipts/[purchaseId]`?

Rekomendasi lock:

> Untuk MVP, receipt digabung di pass detail. Route khusus receipt bisa dibuat
> nanti jika dibutuhkan.

### 3. Domain Untuk Anchor

MoneyGram/anchor membutuhkan domain yang bisa dikontrol dan bisa serve:

```text
https://<domain>/.well-known/stellar.toml
```

Tidak wajib beli domain baru jika sudah punya domain lama.

Rekomendasi:

> Pakai subdomain sendiri, misalnya `quorum.domainkamu.com`, lalu connect ke
> Vercel project Quorum.

Lebih baik app Quorum dan `stellar.toml` berada di domain yang sama agar
identity anchor jelas.

Keputusan yang perlu diambil:

> Domain/subdomain apa yang akan dipakai untuk Quorum?

### 4. MoneyGram Scope

Rekomendasi:

> Untuk hackathon, lock sebagai MoneyGram-compatible + sandbox/mock fallback,
> bukan janji production cash-out.

Alasan:

- sandbox/testnet flow possible;
- production cash-out membutuhkan partner/compliance;
- allowlisting bisa memakan waktu;
- demo tetap kuat selama architecture dan proof-nya jelas.

Keputusan yang perlu diambil:

> Apakah scope hackathon adalah sandbox/mock compatible flow, atau harus
> mengejar MoneyGram sandbox beneran?

## PR Development Besar Berikutnya

Ini bukan PR GitHub spesifik, tapi kelompok pekerjaan besar yang perlu
dibereskan.

### PR 1: Supabase/Postgres Migration

Status:

- migration baseline sudah masuk ke `main`;
- codebase sudah menggunakan `pg` dan Postgres/Supabase-ready persistence;
- pekerjaan yang tersisa adalah environment setup, hosted migration, dan
  verification di Supabase/Vercel.

Tujuan tersisa:

- membuat hosted app benar-benar memakai Supabase/Postgres;
- memastikan event/pass/purchase/check-in/withdraw tetap tersimpan durable di
  hosted environment;
- memastikan semua smoke test tetap valid setelah env Supabase/Vercel dipasang.

Yang perlu dikerjakan:

- buat Supabase project;
- siapkan server-only `DATABASE_URL`;
- jalankan hosted Postgres migrations;
- konfigurasi Vercel env;
- tarik/validasi env yang dipakai hosted runtime;
- jalankan smoke tests dengan Postgres/Supabase env;
- pastikan uniqueness constraint untuk tx hash tetap ada.

Acceptance criteria:

- hosted app bisa run dengan Postgres/Supabase;
- event, pass, purchase, check-in, withdrawal tersimpan;
- duplicate/replayed tx hash tetap ditolak;
- tidak ada secret Supabase yang bocor ke browser;
- smoke tests utama tetap pass.

### PR 2: Custom Soroban Event Indexer

Tujuan:

- membaca event on-chain dari Stellar/Soroban RPC;
- menyimpan event Quorum ke database;
- menyediakan data reliable untuk evidence, receipt, ledger, dan dashboard.

Kenapa perlu:

- Stellar RPC bukan database history permanen untuk app;
- app perlu menyimpan event sendiri agar bukti transaksi tidak hilang dari
  recent RPC window;
- evidence page tidak boleh hanya bergantung pada query langsung ke RPC.

Yang perlu dikerjakan:

- buat tabel `stellar_events`;
- buat tabel `indexer_state`;
- tentukan contract IDs yang di-index;
- tentukan daftar event contract yang penting;
- buat worker/cron yang memanggil Stellar RPC `getEvents`;
- filter event hanya untuk contract Quorum;
- simpan event secara idempotent;
- update cursor/last ledger yang sudah diproses;
- tambahkan logging dan failure handling.

Acceptance criteria:

- indexer bisa jalan ulang tanpa duplikasi data;
- event contract Quorum masuk ke Supabase;
- indexer menyimpan last processed ledger/cursor;
- UI/API bisa membaca indexed events;
- jika RPC gagal sementara, proses bisa retry tanpa merusak data.

Cost:

- software custom indexer: gratis;
- testnet RPC: cukup untuk hackathon;
- Supabase free tier bisa dipakai untuk awal;
- Vercel Cron atau scheduler lain bisa dipakai;
- production scale nanti mungkin butuh RPC/indexer provider berbayar.

### PR 3: Live Transaction Evidence Page

Tujuan:

- membuat halaman bukti transaksi yang rapi dan bisa ditunjukkan ke judge;
- menampilkan transaksi Quorum, bukan semua transaksi Stellar;
- memberi link ke Stellar Explorer untuk verifikasi eksternal.

Scope MVP:

- `/evidence` untuk global/demo evidence;
- `/events/[eventId]/proof` untuk event-specific evidence;
- filter by event, type, status;
- tx hash, shortened wallet, amount, asset, timestamp, explorer link;
- clear empty/loading/error states.

Acceptance criteria:

- judge bisa membuka public evidence page tanpa login;
- organizer bisa melihat evidence event-nya;
- collaborator/buyer hanya melihat detail yang relevan dengan wallet mereka;
- semua tx hash yang tampil punya link explorer;
- data tidak mengekspos secret atau data sensitif.

### PR 4: Receipt / Pass Proof

Tujuan:

- setelah checkout, buyer punya bukti pembelian yang jelas;
- pass detail berfungsi sebagai receipt + proof.

Scope MVP:

- receipt digabung di pass detail;
- tampilkan event name, amount, asset, buyer wallet, tx hash, explorer link,
  pass/token ID, dan status;
- tampilkan check-in/resource status jika relevan.

Acceptance criteria:

- buyer bisa membuka pass dan melihat receipt;
- organizer bisa memverifikasi pass;
- tx hash dan explorer link terlihat jelas;
- UI terasa seperti receipt, bukan debug panel.

### PR 5: Collaborator Ledger

Tujuan:

- collaborator bisa melihat hak payout mereka secara transparan;
- setiap credit/debit punya sumber yang bisa dicek.

Penjelasan sederhana:

Ledger adalah buku catatan uang. Contoh:

- event menerima 50 USDC;
- speaker berhak 20%, berarti +10 USDC;
- speaker withdraw 6 USDC, berarti -6 USDC;
- sisa withdrawable 4 USDC.

Scope MVP:

- collaborator dashboard/ledger;
- total earned, withdrawable, withdrawn;
- daftar transaksi credit/debit;
- link ke event dan tx proof;
- status payout.

Acceptance criteria:

- collaborator hanya melihat ledger yang berhubungan dengan wallet mereka;
- angka ledger konsisten dengan split/purchase/withdrawal;
- setiap row punya sumber transaksi;
- ledger bisa dipakai untuk menjelaskan value Quorum ke judge.

### PR 6: Anchor-ready / MoneyGram-compatible Payout

Tujuan:

- membuat Quorum siap mengarahkan payout ke anchor/off-ramp;
- membuktikan bahwa payout tidak berhenti sebagai angka di dashboard.

Scope MVP:

- tabel `anchor_payouts`;
- payout request flow;
- provider interface;
- MoneyGram-compatible provider;
- sandbox/mock fallback;
- status: created, pending_kyc, pending_anchor, processing, completed,
  failed, cancelled;
- reference ID dan external URL jika ada;
- proof di evidence/ledger.

Acceptance criteria:

- collaborator bisa membuat payout request;
- payout request tersimpan di DB;
- UI menampilkan status payout;
- mock/sandbox flow bisa didemokan;
- jika MoneyGram sandbox access siap, provider bisa disambungkan tanpa
  mengubah konsep UI utama.

### PR 7: QR / Check-in Polish

Tujuan:

- membuat pass dan check-in terasa seperti fitur event yang nyata.

Scope MVP:

- QR pass yang jelas;
- organizer check-in screen yang rapi;
- status checked-in/not checked-in;
- duplicate check-in guard;
- check-in proof masuk ke evidence.

Acceptance criteria:

- buyer bisa menunjukkan pass/QR;
- organizer bisa memverifikasi pass;
- duplicate check-in ditolak atau ditandai idempotent;
- check-in proof terlihat di event evidence.

## Environment Notes

Current app masih membutuhkan env Stellar testnet yang sudah didokumentasikan di
`docs/PRODUCTION_ENV_HANDOFF.md`.

Untuk Supabase nanti:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
DIRECT_DATABASE_URL="postgresql://<user>:<password>@<direct-host>:<port>/<database>?sslmode=require"
```

`DIRECT_DATABASE_URL` opsional, tetapi berguna jika pooled connection dipakai
untuk runtime dan direct connection dipakai untuk migration.

Jangan commit:

- Supabase password;
- service-role key;
- Stellar secret key/seed phrase;
- MoneyGram credentials;
- production session secret.

Untuk anchor/MoneyGram, domain perlu bisa serve:

```text
/.well-known/stellar.toml
```

Rekomendasi domain:

```text
https://quorum.<domain-kamu>
```

## Suggested Development Order

Ini bukan jadwal per hari. Ini hanya urutan dependency yang paling masuk akal.

1. Supabase/Vercel hosted env verification.
2. Custom Soroban Event Indexer.
3. Live Transaction Evidence Page.
4. Receipt/pass proof polish.
5. Collaborator ledger.
6. Anchor-ready/MoneyGram-compatible payout.
7. QR/check-in polish.
8. Stellar Wallet Kit, kalau semua core sudah stabil.

Alasan urutan ini:

- Supabase/Postgres baseline sudah masuk, tetapi hosted env perlu diverifikasi.
- Indexer butuh database durable yang sudah benar-benar aktif di environment
  target.
- Evidence page butuh data transaksi yang rapi.
- Receipt dan ledger mengambil manfaat dari evidence/indexed data.
- Anchor payout butuh ledger dan payout state.
- QR/check-in polish bisa menyusul setelah proof layer kuat.

## Risiko Dan Fallback

### Supabase/Vercel Hosted Setup Belum Siap

Fallback:

- jalankan migration dan smoke test lokal dengan Postgres dulu;
- gunakan `docs/FRIEND_DEPLOYMENT_HANDOFF.md` dan
  `docs/VERCEL_ENV_VALUES.example.env` untuk setup;
- jangan klaim hosted persistence sampai Vercel env dan Supabase migrations
  sudah lolos verifikasi;
- pertahankan uniqueness tx hash.

### Indexer Belum Stabil

Fallback:

- evidence page sementara membaca persisted live transaction result dari DB;
- indexer tetap lanjut sebagai enhancement;
- jangan klaim full indexed history kalau belum benar.

### MoneyGram Allowlist Belum Siap

Fallback:

- gunakan sandbox/mock anchor provider;
- tetap tampilkan MoneyGram-compatible architecture;
- jangan klaim production cash-out.

### Wallet Kit Memakan Waktu

Fallback:

- tetap Freighter-only;
- prioritaskan signing flow yang sudah ada;
- Wallet Kit masuk fase setelah core proof stabil.

### Receipt Scope Melebar

Fallback:

- gabungkan receipt di pass detail;
- jangan bikin email receipt dulu.

## Demo Narrative Yang Harus Dikejar

Demo yang ideal:

1. Organizer membuat paid event.
2. Event punya split collaborator.
3. Attendee membeli pass dengan USDC testnet lewat Freighter.
4. Buyer mendapat pass + receipt + tx proof.
5. Evidence page menunjukkan transaksi live Quorum dan link explorer.
6. Collaborator melihat ledger: earned, withdrawable, withdrawn.
7. Collaborator membuat payout request.
8. Payout diarahkan ke anchor-ready/MoneyGram-compatible flow.
9. Organizer melakukan check-in dengan pass/QR.
10. Judge melihat bahwa semua flow punya proof, bukan hanya angka lokal.

Kalimat pitch teknikal:

> Quorum turns paid community events into verifiable Stellar settlement flows:
> attendees pay, collaborators see a ledger, payouts become anchor-ready, and
> every critical step can be proven with transaction evidence.

## Reference Links

- Stellar RPC `getEvents`: https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getEvents
- Stellar Indexers: https://developers.stellar.org/docs/data/indexers
- Stellar Anchors: https://developers.stellar.org/docs/learn/fundamentals/anchors
- Stellar Anchor Platform: https://developers.stellar.org/docs/platforms/anchor-platform
- MoneyGram Ramps: https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- Stellar Wallet Integration: https://developers.stellar.org/docs/tools/developer-tools/wallets
