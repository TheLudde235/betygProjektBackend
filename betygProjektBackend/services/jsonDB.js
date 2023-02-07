import fs from 'fs';
export default class jsonDB {
  #jsonData = '';
  #path = './database/database.json';

  #updateData() {
    this.#jsonData = fs.readFileSync(this.#path);
  }
  async get(key) {
    this.#updateData();
    return JSON.parse(this.#jsonData)[key];
  }
  async list(prefix) {
    this.#updateData();
    const jsObject = JSON.parse(this.#jsonData);
    const out = [];
    for (const child in jsObject) {
      const split = child.split(prefix);
       if (!prefix || (split.length > 0 && split[0].length <= 0)) {
        out.push(child);
      }
    }
    return out;
  }
  async set(key, value) {
    this.#updateData();
    const jsObject = JSON.parse(this.#jsonData);
    jsObject[key] = value;
    fs.writeFileSync(this.#path, JSON.stringify(jsObject));
    return jsObject;
  }
  async delete(key) {
    this.#updateData();
    const jsObject = JSON.parse(this.#jsonData);
    const out = {};
    for (const child in jsObject) {
      if (child === key) continue;
      out[child] = jsObject[child];
    }
    fs.writeFileSync(this.#path, JSON.stringify(out));
    return out;
  }
}