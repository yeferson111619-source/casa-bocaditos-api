import { DatabaseSync } from 'node:sqlite';
export function repository(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT NOT NULL CHECK(length(cliente) BETWEEN 2 AND 100),
    fecha TEXT NOT NULL UNIQUE,
    personas INTEGER NOT NULL CHECK(personas BETWEEN 1 AND 1000)
  );`);
  return {
    all:()=> db.prepare('SELECT * FROM reservas ORDER BY fecha,id').all(),
    get:id=> db.prepare('SELECT * FROM reservas WHERE id=?').get(id),
    create:x=> {
      const result=db.prepare('INSERT INTO reservas(cliente,fecha,personas) VALUES(?,?,?)').run(x.cliente,x.fecha,x.personas);
      return db.prepare('SELECT * FROM reservas WHERE id=?').get(result.lastInsertRowid);
    },
    update:(id,x)=>db.prepare('UPDATE reservas SET cliente=?,fecha=?,personas=? WHERE id=?').run(x.cliente,x.fecha,x.personas,id),
    delete:id=>db.prepare('DELETE FROM reservas WHERE id=?').run(id),
    close:()=>db.close()
  };
}
