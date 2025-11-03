// ============================================
// NOTED - Database Service Selector with Initialization Guarantee
// Uses SQLite for native, localStorage for web
// Ensures database is fully initialized before any operations
// ============================================

import { Platform } from 'react-native';

let databaseInstance: any = null;
let initPromise: Promise<any> | null = null;
let isInitialized = false;

async function initializeDatabase(): Promise<any> {
  console.log('🔧 Initializing database service...');

  if (Platform.OS === 'web') {
    // Web database
    const module = await import('./webDatabase');
    databaseInstance = module.webDb;
  } else {
    // Native database
    const module = await import('./database');
    databaseInstance = module.db;
  }

  // Now initialize the database (create tables, run migrations)
  if (databaseInstance && databaseInstance.init) {
    console.log('📋 Running database init...');
    await databaseInstance.init();
    console.log('✅ Database fully initialized');
  }

  isInitialized = true;
  return databaseInstance;
}

// Single initialization authority - ensures database init happens exactly once
export const getDatabase = async (): Promise<any> => {
  // If already initialized, return cached instance
  if (isInitialized && databaseInstance) {
    return databaseInstance;
  }

  // If initialization is already in progress, wait for it
  if (initPromise) {
    console.log('⏳ Waiting for database init to complete...');
    return await initPromise;
  }

  // Start initialization
  console.log('🚀 Starting database initialization...');
  initPromise = initializeDatabase();
  const db = await initPromise;
  return db;
};

// For immediate use (after getDatabase has been called)
export const getDatabaseSync = (): any => {
  if (!isInitialized || !databaseInstance) {
    throw new Error('Database not initialized yet - call getDatabase() first');
  }
  return databaseInstance;
};
