import { DB } from "./DB";
import { Helper } from "./Helper";

const db = new DB();
const table = "sections";
export class Section{
    async all(){
        let sql = 'select * from sections order by id';
        let result = db.all(sql);

        return result
    }

    async create(sections){
        let response = await db.insert(table, sections)
        return response;
    }
}
