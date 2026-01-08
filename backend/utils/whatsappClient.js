const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');

let client;
let isReady = false;

const initializeWhatsApp = () => {
    console.log('Initializing WhatsApp Client (RemoteAuth)...');
    
    // Create MongoStore using the existing mongoose connection
    const store = new MongoStore({ mongoose: mongoose });

    client = new Client({
        authStrategy: new RemoteAuth({
            clientId: "flipkart-sarees",
            store: store,
            backupSyncIntervalMs: 600000 
        }),
        authTimeoutMs: 60000, 
        qrMaxRetries: 5,
        puppeteer: {
            headless: process.env.NODE_ENV === 'production' ? true : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
        }
    });

    console.log('Registering WhatsApp Event Handlers...');

    // Diagnostic: Track session persistence
    client.on('remote_session_saved', () => {
        console.log('--- SUCCESS: WhatsApp Remote Session SAVED to Database ---');
    });

    client.on('remote_session_restored', () => {
        console.log('--- SUCCESS: WhatsApp Remote Session RESTORED from Database ---');
    });

    client.on('qr', (qr) => {
        console.log('\n--- NEW QR CODE GENERATED (Rotate/Update) ---');
        qrcode.generate(qr, { small: true });
        console.log('Note: Use your WhatsApp Linked Devices to scan this.');
        console.log('If already scanned, wait for the READY message.\n-------------------------------------------------------\n\n');
    });

    client.on('ready', () => {
        isReady = true;
        console.log('--- WhatsApp Client is READY to send messages! ---');
    });

    client.on('authenticated', () => {
        console.log('--- WhatsApp Authenticated successfully! Initializing store... ---');
    });

    client.on('auth_failure', (msg) => {
        console.error('--- WhatsApp Authentication Failure:', msg);
    });

    client.initialize().catch(err => {
        console.error('--- WhatsApp Initialization Error:', err);
    });
    
    return client;
};

const getWhatsAppClient = () => client;
const isClientReady = () => isReady;

module.exports = { initializeWhatsApp, getWhatsAppClient, isClientReady };
