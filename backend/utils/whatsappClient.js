const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;

const initializeWhatsApp = () => {
    console.log('Initializing WhatsApp Client...');
    
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "flipkart-sarees"
        }),
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
        console.log('--- WhatsApp Client is READY to send messages! ---');
    });

    client.on('authenticated', () => {
        console.log('--- WhatsApp Authenticated successfully! ---');
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

module.exports = { initializeWhatsApp, getWhatsAppClient };
