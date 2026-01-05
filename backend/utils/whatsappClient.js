const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

const initializeWhatsApp = () => {
    console.log('Initializing WhatsApp Client...');
    
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "flipkart-sarees"
        }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: {
            headless: true, // or "new" for newer puppeteer versions
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
