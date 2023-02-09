import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  application_name: '$ fullstack_taxami',
  port: 3000
});

export const prefixes = {
  user: '61dc4184',
  worker: 'd418c46f'
};

export default class Database {
  async query(text, params) {
    const start = Date.now()
    const res = await client.query(text, params)
    const duration = Date.now() - start
    console.log('executed query', { text, duration, rows: res.rowCount })
    return res
  }
 
  async getClient() {
    await client.connect()
    const query = client.query
    const release = client.release

    client.query = (...args) => {
      client.lastQuery = args
      return query.apply(client, args)
    }
    client.release = () => {
      client.query = query
      client.release = release
      return release.apply(client)
    }
    return client
  }
}