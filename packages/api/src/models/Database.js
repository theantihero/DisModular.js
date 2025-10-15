/**
 * Database Model - SQLite Database Connection
 * Manages database schema and connections
 * @author fkndean_
 * @date 2025-10-14
 */

import Database from 'better-sqlite3';
import { Logger } from '@dismodular/shared';

const logger = new Logger('Database');

export class DatabaseModel {
  /**
   * Initialize Database
   * @param {string} dbPath - Path to SQLite database
   */
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Enable WAL mode for better performance
    this.initializeTables();
  }

  /**
   * Initialize all database tables
   */
  initializeTables() {
    try {
      // Users table for OAuth
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          discord_id TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          discriminator TEXT,
          avatar TEXT,
          access_token TEXT,
          refresh_token TEXT,
          is_admin INTEGER DEFAULT 0,
          admin_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration: Add is_admin column if it doesn't exist
      try {
        const tableInfo = this.db.prepare("PRAGMA table_info(users)").all();
        const hasIsAdmin = tableInfo.some(col => col.name === 'is_admin');
        
        if (!hasIsAdmin) {
          logger.info('Migrating users table: adding is_admin column');
          this.db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
          this.db.exec('ALTER TABLE users ADD COLUMN admin_notes TEXT');
          logger.success('Users table migrated successfully');
        }
      } catch (migrationError) {
        logger.warn('Migration check/execution skipped:', migrationError.message);
      }

      // Plugins table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS plugins (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          description TEXT,
          author TEXT,
          type TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          trigger_type TEXT,
          trigger_command TEXT,
          trigger_event TEXT,
          trigger_pattern TEXT,
          nodes TEXT NOT NULL,
          edges TEXT NOT NULL,
          compiled TEXT NOT NULL,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Plugin state table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS plugin_state (
          plugin_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (plugin_id, key),
          FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
        )
      `);

      // Bot configuration table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS bot_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Audit log table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          action TEXT NOT NULL,
          resource_type TEXT,
          resource_id TEXT,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      logger.success('Database tables initialized');
    } catch (error) {
      logger.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   * @returns {Database} Database instance
   */
  getInstance() {
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
    logger.info('Database connection closed');
  }

  /**
   * Add audit log entry
   * @param {Object} entry - Audit log entry
   */
  addAuditLog(entry) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        entry.userId,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        JSON.stringify(entry.details || {})
      );
    } catch (error) {
      logger.error('Failed to add audit log:', error);
    }
  }

  /**
   * Get audit logs
   * @param {Object} options - Query options
   * @returns {Array} Audit logs
   */
  getAuditLogs(options = {}) {
    try {
      let query = 'SELECT * FROM audit_log';
      const conditions = [];
      const params = [];

      if (options.userId) {
        conditions.push('user_id = ?');
        params.push(options.userId);
      }

      if (options.resourceType) {
        conditions.push('resource_type = ?');
        params.push(options.resourceType);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      return this.db.prepare(query).all(...params);
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      return [];
    }
  }
}

export default DatabaseModel;

