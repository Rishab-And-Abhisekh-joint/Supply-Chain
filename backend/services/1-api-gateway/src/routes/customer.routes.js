// =============================================================================
// FILE: src/routes/customer.routes.js
// ACTION: CREATE NEW - Handle customer CRUD via API Gateway
// =============================================================================

const express = require('express');
const router = express.Router();
const customerService = require('../services/customer.service');

// GET /api/customers - List all customers (paginated)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, search } = req.query;
    const customers = await customerService.findAll({ page, pageSize, search });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res, next) => {
  try {
    const customer = await customerService.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customers/:id - Update customer
router.patch('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res, next) => {
  try {
    await customerService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
