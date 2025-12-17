// =============================================================================
// FILE: src/services/customer.service.js
// ACTION: CREATE NEW
// =============================================================================

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const customerService = {
  async findAll({ page = 1, pageSize = 20, search } = {}) {
    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  },
  
  async findById(id) {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  async create(data) {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO customers (id, firebase_uid, email, name, phone, address, city, state, pincode, country, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [id, data.firebaseUid, data.email, data.name, data.phone, data.address, data.city, data.state, data.pincode, data.country || 'India']
    );
    return result.rows[0];
  },
  
  async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await pool.query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },
  
  async remove(id) {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    return true;
  },
};

module.exports = customerService;