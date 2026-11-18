CREATE TABLE IF NOT EXISTS oauth_states (state_hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id_hash TEXT PRIMARY KEY, login TEXT NOT NULL, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS access_grants (login TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('viewer','contributor')), updated_by TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS git_objects (session_hash TEXT NOT NULL, kind TEXT NOT NULL, sha TEXT NOT NULL, parent TEXT, expires INTEGER NOT NULL, PRIMARY KEY(session_hash,kind,sha));
CREATE INDEX IF NOT EXISTS git_objects_expiry ON git_objects(expires);
