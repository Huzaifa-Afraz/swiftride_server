import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import { Wallet } from './src/models/wallet.model.js';
import { WalletTransaction } from './src/models/walletTransaction.model.js';
import { Booking } from './src/models/booking.model.js';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swiftride_db";

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Find wallet with balance 9000
        const wallet = await Wallet.findOne({ balanceAvailable: 9000 });
        if (!wallet) {
            console.log('No wallet found with balance 9000');
            // Try pending 12600
             const wallet2 = await Wallet.findOne({ balancePending: 12600 });
             if(wallet2) console.log('Found wallet via pending:', wallet2);
             else console.log('No wallet found via pending either');
            return;
        }
        console.log('Wallet found:', wallet);
        
        const host = await User.findById(wallet.user);
        console.log('User found:', host.email);

        const txCount = await WalletTransaction.countDocuments({ user: host._id });
        console.log('Transaction Count:', txCount);

        const bookingsCount = await Booking.countDocuments({ owner: host._id });
        console.log('Booking Count:', bookingsCount);

        // Check if there are ANY transactions in the system
        const allTx = await WalletTransaction.countDocuments({});
        console.log('Total System Transactions:', allTx);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
