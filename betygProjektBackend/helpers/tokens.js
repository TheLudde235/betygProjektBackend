import { cockDB } from "../index.js";
import jwt from 'jsonwebtoken';

export const getWorkerToken = async (user) => {
    const { useruuid, email, firstname, lastname } = user;
    return jwt.sign({firstname, lastname, uuid: useruuid, estates: (await cockDB.query('select estateuuid from estate_worker_relations where workeruuid=$1', [useruuid])).rows.map(row => row.estateuuid)}, process.env.JWT_SECRET);
}