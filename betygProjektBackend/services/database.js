import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  application_name: '$ fullstack_taxami',
  port: process.env.PORT
});

export default class Database {
  async query(text, params) {
    const res = await client.query(text, params)
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