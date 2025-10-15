/**
 * Plugin Routes
 * @author fkndean_
 * @date 2025-10-14
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

/**
 * Create plugin routes
 * @param {Object} pluginController - Plugin controller instance
 * @returns {Router} Express router
 */
export function createPluginRoutes(pluginController) {
  const router = Router();

  // Get all plugins (read-only, requires auth)
  router.get('/', requireAuth, (req, res) => pluginController.getAll(req, res));

  // Get plugin by ID (read-only, requires auth)
  router.get('/:id', requireAuth, (req, res) => pluginController.getById(req, res));

  // Create new plugin (requires admin)
  router.post('/', requireAdmin, (req, res) => pluginController.create(req, res));

  // Update plugin (requires admin)
  router.put('/:id', requireAdmin, (req, res) => pluginController.update(req, res));

  // Delete plugin (requires admin)
  router.delete('/:id', requireAdmin, (req, res) => pluginController.delete(req, res));

  // Compile node graph (requires admin)
  router.post('/compile', requireAdmin, (req, res) => pluginController.compile(req, res));

  return router;
}

export default createPluginRoutes;

