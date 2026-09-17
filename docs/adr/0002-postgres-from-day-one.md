# PostgreSQL from day one, not SQLite for the pilot

The dev machine had no local Postgres or Docker, so SQLite (zero setup) was the easy path for the pilot. We chose to install PostgreSQL natively instead, because the eventual deployment target is a hospital on-prem intranet server running the same schema for real multi-ward concurrent use — building on SQLite would mean a migration (and a round of "does this behave the same under Postgres" testing) right before go-live. Paying the native-install cost once now avoids that.
