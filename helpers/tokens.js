import { cockDB } from "../index.js";
import jwt from 'jsonwebtoken';

export const getWorkerToken = async (user) => {
    const { useruuid, email, firstname, lastname } = user;
    return jwt.sign({firstname, lastname, uuid: useruuid, admin: false, estates: (await cockDB.query('select estateuuid from estate_worker_relations where workeruuid=$1', [useruuid])).rows.map(row => row.estateuuid)}, process.env.JWT_SECRET);
}

export const getAdminToken = async (user) => {
    const {uuid, email, username} = user;
    return jwt.sign({uuid, email, username, admin: true, estates: (await cockDB.query('select estateuuid from estates where adminuuid=$1', [uuid])).rows.map(row => row.estateuuid)}, process.env.JWT_SECRET, {expiresIn: '8h'});
}