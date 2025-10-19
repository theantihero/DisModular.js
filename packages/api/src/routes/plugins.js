/**
 * Plugin Routes
 * @author fkndean_
 * @date 2025-10-14
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { templateLimiter } from '../middleware/rateLimiter.js';

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

  // Toggle plugin enabled status (requires admin, no file system writes)
  router.patch('/:id/toggle', requireAdmin, (req, res) => pluginController.toggleEnabled(req, res));

  // Delete plugin (requires admin)
  router.delete('/:id', requireAdmin, (req, res) => pluginController.delete(req, res));

  // Compile node graph (requires admin)
  router.post('/compile', requireAdmin, (req, res) => pluginController.compile(req, res));

  // Template plugin endpoints (public, no auth required)
  router.get('/templates', templateLimiter, (req, res) => pluginController.getTemplates(req, res));
  router.post('/clone/:templateId', requireAuth, templateLimiter, (req, res) => pluginController.cloneTemplate(req, res));

  return router;
}

export default createPluginRoutes;

