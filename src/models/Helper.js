import { resolve } from "path";
import sqlite3 from "sqlite3";
const util    = require('util');

const db = new sqlite3.Database(
    "/home/basis/Downloads/app-descktop/src/database/database.db"
);

db.run = util.promisify(db.run);
db.all = util.promisify(db.all);
db.get = util.promisify(db.get);

export class Helper{
    async max(table){
        let sql = 'select case when max(id) is null then 0 else max(id) end as "max" from ' + table;

        let result = await db.get(sql);
        return result.max
    }

    async insertMany(table, array){
        let resolved = false
        if(array.length > 0){
            let map = '';
            let row = '';
            let count = 0;
            let sql = '';
        
            let updated_at = null;
            let deleted_at = null;
            for (let e of array) {
                const todo = await fetch(e);
                count += 1;
                updated_at = (e.updated_at == null) ? null : "'"+e.updated_at+"'";
                deleted_at = (e.deleted_at == null) ? null : "'"+e.deleted_at+"'";
                let separator = (count == array.length) ? ");" : "),";
                if (table == 'products') {
                    row = "("+e.id+",'"+e.name+"',"+e.price+","+e.section_id+","+e.ask_obs+",'"+e.created_at+"',"+updated_at+","+deleted_at + separator;
                }else if (table == 'sections') {
                    row = "("+e.id+",'"+e.name+"','"+e.created_at+"',"+updated_at+","+deleted_at + separator;
                }
                map += row;
            }

            if (table == 'products') {
                sql = 'INSERT INTO products values' + map;
            }else if (table == 'sections') {
                sql = 'INSERT INTO sections values' + map;
            }

            let res = await db.run(sql).then(()=>{
                resolved = true;
            }).catch((e)=>{
                resolved = false;
            })
        }

        return resolved;
    }
}
