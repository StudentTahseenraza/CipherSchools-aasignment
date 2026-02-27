import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkDatabase() {
    console.log('🔍 Database Diagnostic Tool');
    console.log('===========================\n');

    // Check MongoDB connection
    console.log('📦 MongoDB Check:');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        
        // Get database stats
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`📊 Collections found: ${collections.length}`);
        
        collections.forEach(col => console.log(`   - ${col.name}`));
        
        // Check assignments collection
        if (collections.some(c => c.name === 'assignments')) {
            const { Assignment } = await import('./models/mongodb/Assignment.model.js');
            const count = await Assignment.countDocuments();
            console.log(`\n📝 Assignments in database: ${count}`);
            
            if (count > 0) {
                const assignments = await Assignment.find().limit(3);
                console.log('\n📋 Sample assignments:');
                assignments.forEach((a, i) => {
                    console.log(`   ${i+1}. ${a.title} (${a.difficulty})`);
                });
            } else {
                console.log('❌ No assignments found!');
            }
        }
        
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }

    console.log('\n📋 Next Steps:');
    console.log('1. If no assignments found, run: npm run seed');
    console.log('2. Make sure MONGODB_URI is correct in .env');
    console.log('3. Check if database name is correct');
}

checkDatabase();