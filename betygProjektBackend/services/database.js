import {v4 as uuid} from 'uuid';
import jsonDB from './jsonDB.js';
const db = new jsonDB();

export const prefixes = {
  user: '61dc4184',
  worker: 'd418c46f'
}


export default class Database {
  set(key, value, prefix = '') {
    return db.set(prefix + key + uuid(), value);
  }
  get(key, prefix = '') {
    return db.get(prefix + key);
  }
  list(prefix = '') {
    return db.list(prefix);
  }
  delete(key) {
    return db.delete(key);
  }

  async getByPrefix(prefix) {
    if (!prefix) return;
    const out = [];
    const matches = await this.list(prefix);
    for (const match of matches) {
      out.push(await this.get(match));
    };
    return out;
  }

  async has(key, prefix = '') {
    return ((await this.getByPrefix(prefix + key)).length > 0)
  }
}