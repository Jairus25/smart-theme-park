# Smart Theme Park Operations Management System — Couchbase + React

Digital Assignment 3: the same theme-park scenario, implemented on an
**advanced database technology** (Couchbase, a distributed document/NoSQL
database) with a **React frontend** talking to a Node.js/Express API that
bridges it to the database, as the brief requires.

---

## 1. Project layout

```
theme_park_couchbase/
├── couchbase/
│   ├── 01_create_collections.n1ql   # bucket scope/collections (run first)
│   ├── 02_indexes.n1ql              # primary + secondary indexes
│   ├── 03_sample_data.n1ql          # sample JSON documents
│   └── 04_sample_queries.n1ql       # 12 demo N1QL queries for the viva
├── server/                          # Node.js + Express API
│   ├── package.json
│   ├── .env.example                 # copy to .env, fill in Capella creds
│   └── src/
│       ├── db.js                    # Couchbase connection wrapper
│       ├── server.js                # Express app + /api/dashboard, /api/health
│       └── routes/                  # visitors, rides, maintenance, feedback, reports
├── client/                          # React (Vite) frontend
│   ├── package.json
│   ├── vite.config.js               # dev-server proxy to the API
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx, api.js, styles.css
│       ├── components/ (NavBar, Flash)
│       └── pages/ (Dashboard, Visitors, Rides, Maintenance, Feedback, Reports)
└── README.md                        # this file
```

Both `server/` and `client/` had their `node_modules/` removed before
zipping to keep the archive small — `npm install` in each restores them.

---

## 2. Set up Couchbase Capella (free tier, cloud — no local install)

1. Go to https://cloud.couchbase.com/ and sign up for a free account.
2. Create a new **free tier cluster** (takes a few minutes to provision).
3. Once it's running: **Clusters → your cluster → "theme_park" bucket** —
   create a bucket named exactly `theme_park` (any default size on the free
   tier is fine).
4. **Security → Database Access → Create Database Credential** — this is a
   separate username/password *just for app connections* (not your Capella
   login). Name it e.g. `theme_park_app`, give it read/write access to the
   `theme_park` bucket, and save the password somewhere safe (shown only
   once).
5. **Security → Networking → Allowed IP Addresses** — add your current
   machine's IP (Capella has an "Add Current IP" button). Without this, the
   connection times out no matter how correct your credentials are.
6. **Clusters → your cluster → "Connect" tab** — copy the connection string
   (starts with `couchbases://...`). You'll need this plus the credential
   from step 4 in `server/.env`.

---

## 3. Load the schema, indexes, and sample data

1. In Capella: **your cluster → "Query Workbench"** (or **Tools → Query**).
2. Open `couchbase/01_create_collections.n1ql` from this project, copy its
   contents, paste into the Query Workbench editor, click **Execute**.
3. Repeat for `couchbase/02_indexes.n1ql`.
4. Repeat for `couchbase/03_sample_data.n1ql`.
5. Verify it loaded — run this in the Query Workbench:
   ```sql
   SELECT COUNT(*) AS n FROM theme_park.park.visitors;
   SELECT COUNT(*) AS n FROM theme_park.park.rides;
   ```
   You should see 4 visitors and 4 rides.
6. (Optional, for the viva) Try a few queries from
   `couchbase/04_sample_queries.n1ql` directly in Query Workbench — it shows
   results as a table *and* as raw JSON, which is worth pointing out as a
   contrast with the relational version (every row there was always a flat
   table; here you can see the embedded arrays like `queueSlots` and
   `assignments` sitting inside their parent document).

---

## 4. Run the Express API

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `CB_CONNECTION_STRING` → the `couchbases://...` string from step 2.6
- `CB_USERNAME` / `CB_PASSWORD` → the database credential from step 2.4
- leave `CB_BUCKET=theme_park` and `CB_SCOPE=park` as-is (matches the
  `.n1ql` scripts)

```bash
npm start
```

You should see:
```
Theme Park API listening on http://localhost:4000
Health check: http://localhost:4000/api/health
```

Visit **http://localhost:4000/api/health** in a browser — it should report
`{"status":"ok","couchbase":"connected",...}`. If it reports an error, see
Troubleshooting below before moving on.

---

## 5. Run the React frontend

In a **second terminal**:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. The dashboard should show live counts. The
Vite dev server proxies every `/api/...` request to the Express server on
`:4000` (configured in `client/vite.config.js`), so there's nothing extra
to configure on the client side.

## 6. Deploy the `jairus_auth` branch without merging

Deploy the two parts separately:

- **Vercel:** import the repository, select `jairus_auth`, set the root directory
  to `client`, and use `npm run build` with output directory `dist`.
- **Render:** create a Web Service from the same repository and branch, set the
  root directory to `server`, build command `npm install`, and start command
  `npm start`.

On Vercel, add `VITE_API_URL` with the public Render service URL, such as
`https://your-api.onrender.com`. On Render, add the `CB_CONNECTION_STRING`,
`CB_USERNAME`, `CB_PASSWORD`, `CB_BUCKET`, and `CB_SCOPE` environment variables
from `server/.env.example`. Add the Render service to Capella's allowed
network addresses if the cluster rejects the connection.

Both services can deploy directly from `jairus_auth`; merging into `main` is
not required.

### Pages

| Route           | What it does                                                         |
|-----------------|------------------------------------------------------------------------|
| `/`             | Dashboard: live stats + ride status                                    |
| `/visitors`     | List visitors, register a new one, delete one (cleans up their tickets/reservations) |
| `/rides`        | List rides with participation & sensor health, add a ride, change status |
| `/maintenance`  | Log a maintenance job (auto-sets ride to UNDER_MAINTENANCE), mark complete |
| `/feedback`     | List & submit customer feedback                                        |
| `/reports`      | Aggregate / HAVING / above-average-style N1QL reports                   |

---

## 6. Why Couchbase for this scenario (talking points for the viva/presentation)

- **Schema-on-read fits a scenario with genuinely different document
  shapes**: a `ticket` document, a `ride` document, and a `maintenance`
  document look nothing alike, and in Couchbase that's fine — each
  collection holds whatever JSON shape its documents need, with no `ALTER
  TABLE` required if a new field (say, a ride's `fastPassEligible` flag)
  is needed later for only some rides.
- **Embedding collapses weak entities and junction tables into one read**:
  `QUEUE_SLOT` (a weak entity in the relational design) is now an array
  field inside its `reservation` document — reading a reservation's queue
  status is one document fetch, not a join. Likewise
  `MAINTENANCE_ASSIGNMENT` (a junction table) is now an `assignments` array
  inside the `maintenance` document.
- **N1QL stays SQL-shaped, so the learning curve from the relational
  version is small**: `JOIN`, `GROUP BY`, `HAVING`, and subqueries all
  exist and read almost identically (compare `couchbase/04_sample_queries.n1ql`
  side-by-side with the old Oracle queries). `UNNEST` and `ANY/EVERY ...
  SATISFIES` are the two genuinely new ideas, both for working with
  embedded arrays.
- **Key-value lookups are extremely fast**: fetching one document by its
  key (e.g. `ride::R01`) is a direct KV operation, not a query — useful for
  the high-frequency reads a live park app would do constantly (checking
  one ride's status, one ticket's validity) without touching the query
  engine at all.
- **Horizontal scale-out**: Couchbase is built to shard a bucket across
  nodes and keep serving both KV and N1QL queries as traffic grows — a
  natural fit for a theme park's bursty attendance (a holiday weekend is a
  very different load than a Tuesday in March).

### Trade-offs to be upfront about if asked
- No enforced relational integrity: nothing stops a `ticket` document from
  referencing a `visitorId` that doesn't exist, the way a relational FOREIGN
  KEY would — that check has to live in the application (see `visitors.js`'s
  delete route, which manually cleans up related documents instead of
  relying on `ON DELETE CASCADE`).
- Multi-document transactions exist in Couchbase but are heavier to reach
  for than a single relational `COMMIT`; this project's "log maintenance +
  update ride status" flow deliberately does two separate writes rather
  than wrapping them in a transaction, which is a reasonable choice for a
  demo but worth naming as a simplification if asked.
- Deciding what to embed vs. reference is a real design decision with no
  single right answer (unlike normalization's fairly mechanical rules) —
  be ready to explain *why* `queueSlots` were embedded but `participations`
  were kept as their own collection (see the comment at the top of
  `couchbase/03_sample_data.n1ql`).

---

## 7. Troubleshooting

- **`/api/health` times out / "unambiguous timeout"** — your IP isn't
  allow-listed in Capella (step 2.5), or the connection string in `.env` is
  wrong.
- **`AuthenticationFailure`** — wrong username/password in `.env`, or the
  database credential wasn't given access to the `theme_park` bucket.
- **React dashboard shows nothing / network errors in the browser console**
  — the Express server isn't running on `:4000`, or you started `npm run
  dev` from the wrong folder.
- **N1QL query errors with "No index available"** — `02_indexes.n1ql`
  wasn't run, or wasn't run against the same bucket/scope the app is
  querying.
- **Re-running `03_sample_data.n1ql` fails with duplicate key errors** —
  you're re-inserting document keys that already exist; either delete the
  bucket's data first (`DELETE FROM theme_park.park.<collection>;` for
  each collection, or drop and recreate the bucket) or skip re-running it.
