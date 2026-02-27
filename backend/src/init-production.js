import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeProduction() {
    console.log('🚀 Initializing production environment...');
    
    try {
        // Check if MongoDB is accessible
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connection successful');
        
        // Check if assignments exist
        const { Assignment } = await import('./models/mongodb/Assignment.model.js');
        const count = await Assignment.countDocuments();
        
        if (count === 0) {
            console.log('📦 No assignments found. Running seed script...');
            
            // Run seed script
            const seedPath = join(__dirname, 'seed-mock-data.js');
            
            // Dynamic import of seed script
            await import(seedPath);
            
            console.log('✅ Seed data loaded successfully');
        } else {
            console.log(`📦 Found ${count} existing assignments`);
        }
        
        console.log('✅ Production initialization complete');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

initializeProduction();