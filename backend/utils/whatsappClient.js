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
            backupSyncIntervalMs: 600000 // Backup every 10 minutes
        }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
        }
    });

    client.on('qr', (qr) => {
        console.log('\n\n--- ACTION REQUIRED: SCAN THIS QR CODE FOR WHATSAPP ---');
        qrcode.generate(qr, { small: true });
        console.log('Note: Use your WhatsApp Linked Devices to scan this.\n-------------------------------------------------------\n\n');
    });

    client.on('ready', () => {
        isReady = true;
        console.log('--- WhatsApp Client is READY to send messages! ---');
    });

    client.on('authenticated', () => {
        console.log('--- WhatsApp Authenticated successfully! Wait for READY... ---');
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
