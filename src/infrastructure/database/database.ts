import * as SQLite from "expo-sqlite";

export const DB_NAME = "simple_manager.db";

export let db = SQLite.openDatabaseSync(DB_NAME);

export const reinitializeDatabase = () => {
  try {
    db.closeSync();
  } catch (e) {
    // Already closed or other error
  }
  db = SQLite.openDatabaseSync(DB_NAME);
  return db;
};
