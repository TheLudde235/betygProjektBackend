/**
 * 
 * @param {array<string>} columns the columns the user should be able to update
 * @param {string} table the table to update
 * @param {object} whereValues kvps where key=columnname and value should result in columnname=value for the rows which should be affected
 * @param {object} body the request body
 * @returns an object with a query string (query) and the prepared values(values) that only updates the columns specified in the body
 * @throws if nothing changes
 */
export const getUpdateQuery = (columns, table, body, whereValues) => {
    let query = `update ${table} set `;
    const values = [];
    let i = 1;
    for (const key of columns) {
        if (body[key] !== undefined) {
            query += `${i>1?', ':''}${key}=$${i}`;
            values.push(body[key]);
            i++;
        }
    }
    
    if (values.length <= 0) throw Error('Nothing changed');

    query += ' where';

    let j = 0;
    
    for (const key in whereValues) {
        if (j > 0) query += ' and';
        query += ` ${key}=$${i}`;
        values.push(whereValues[key]);
        i++;
        j++;
    }

    return {query, values};
}