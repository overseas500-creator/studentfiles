import Database from 'better-sqlite3';

const db = new Database('school.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);

if (tables.some(t => t.name === 'reports' || t.name === 'Reports')) {
    const tableName = tables.find(t => t.name === 'reports' || t.name === 'Reports').name;
    const reports = db.prepare(`SELECT * FROM ${tableName}`).all();
    console.log("Reports:", reports);
}
