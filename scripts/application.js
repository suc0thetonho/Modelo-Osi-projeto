import * as storage from './storage.js';

export const USER_NAME = 'Antonio Carlos';
const packetStore = new Map();

export function detectProtocol(requestText, hasFile) {
    if (!requestText && !hasFile) return null;

    // Se tem arquivo, prioriza FTP
    if (hasFile) return 'file';

    // Limpa e normaliza o texto
    const text = requestText.trim().toLowerCase();

    // 1. Detectar E-mail (contém @)
    if (text.includes('@')) return 'email';

    // 2. Detectar protocolos específicos digitados pelo usuário
    // (colocado ANTES da detecção de URL para capturar "https" como protocolo)
    const protocolKeywords = [
        { keyword: 'tcp', protocol: 'tcp' },
        { keyword: 'udp', protocol: 'udp' },
        { keyword: 'smtp', protocol: 'smtp' },
        { keyword: 'pop3', protocol: 'pop3' },
        { keyword: 'imap', protocol: 'imap' },
        { keyword: 'ftp', protocol: 'ftp' },
        { keyword: 'ssh', protocol: 'ssh' },
        { keyword: 'telnet', protocol: 'telnet' },
        { keyword: 'dns', protocol: 'dns' },
        { keyword: 'dhcp', protocol: 'dhcp' },
        { keyword: 'https', protocol: 'https' },
        { keyword: 'http', protocol: 'http' }
    ];

    // Verifica se o texto é exatamente um protocolo ou começa com ele
    for (const { keyword, protocol } of protocolKeywords) {
        if (text === keyword) {
            return `protocol_${protocol}`;
        }
    }

    // 3. Detectar URL/HTTP (para entradas como "www.google.com")
    if (
        text.startsWith('http://') ||
        text.startsWith('https://') ||
        text.startsWith('www.') ||
        text.includes('.com') ||
        text.includes('.org') ||
        text.includes('.net') ||
        text.includes('.br') ||
        // Só considera http/https se não for exatamente o protocolo
        (text.includes('http') && text !== 'http' && text !== 'https')
    ) {
        return 'http';
    }

    // 4. Se nada acima, é uma mensagem de chat
    return 'chat';
}

export function getProtocolLabel(type) {
    // Mapeamento para protocolos especiais
    const protocolMap = {
        'protocol_tcp': 'TCP (Transmission Control Protocol)',
        'protocol_udp': 'UDP (User Datagram Protocol)',
        'protocol_smtp': 'SMTP (Simple Mail Transfer Protocol)',
        'protocol_pop3': 'POP3 (Post Office Protocol)',
        'protocol_imap': 'IMAP (Internet Message Access Protocol)',
        'protocol_ftp': 'FTP (File Transfer Protocol)',
        'protocol_ssh': 'SSH (Secure Shell)',
        'protocol_telnet': 'Telnet',
        'protocol_dns': 'DNS (Domain Name System)',
        'protocol_dhcp': 'DHCP (Dynamic Host Configuration Protocol)',
        'protocol_https': 'HTTPS (Hypertext Transfer Protocol Secure)',
        'protocol_http': 'HTTP (Hypertext Transfer Protocol)'
    };

    if (protocolMap[type]) return protocolMap[type];

    switch (type) {
        case 'email': return 'E-mail (SMTP/POP3)';
        case 'http': return 'Site / URL (HTTP/HTTPS)';
        case 'chat': return 'Chat (WebSocket)';
        case 'file': return 'Arquivo (FTP)';
        default: return type || '';
    }
}

export function getProtocolForLayer(type) {
    const map = {
        'email': 'SMTP',
        'http': 'HTTP/HTTPS',
        'chat': 'WebSocket',
        'file': 'FTP',
        'protocol_tcp': 'TCP',
        'protocol_udp': 'UDP',
        'protocol_smtp': 'SMTP',
        'protocol_pop3': 'POP3',
        'protocol_imap': 'IMAP',
        'protocol_ftp': 'FTP',
        'protocol_ssh': 'SSH',
        'protocol_telnet': 'Telnet',
        'protocol_dns': 'DNS',
        'protocol_dhcp': 'DHCP',
        'protocol_https': 'HTTPS',
        'protocol_http': 'HTTP'
    };
    return map[type] || 'HTTP/HTTPS';
}

function formatTimestamp() {
    return new Date().toISOString();
}

function generatePacketKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function registerPacket(packet) {
    packetStore.set(packet.key, packet);
    storage.savePacketKey(packet.key);
    return packet;
}

export function loadLastPacketKey() {
    return storage.loadLastPacketKey();
}

export function getPacketByKey(key) {
    return packetStore.get(key) || null;
}

export function createEmailPacket(remetente, destinatario, assunto, corpo) {
    const packet = {
        key: generatePacketKey(),
        tipo: 'email',
        remetente,
        destinatario,
        assunto,
        corpo,
        protocolo: 'SMTP',
        timestamp: formatTimestamp()
    };
    return registerPacket(packet);
}

export function createHttpPacket(hostIP, usuario) {
    const packet = {
        key: generatePacketKey(),
        tipo: 'site',
        metodo: 'GET',
        hostIP,
        protocolo: 'HTTP/HTTPS',
        usuario,
        timestamp: formatTimestamp()
    };
    return registerPacket(packet);
}

export function createChatPacket(mensagem, usuario) {
    const packet = {
        key: generatePacketKey(),
        tipo: 'chat',
        usuario,
        mensagem,
        protocolo: 'WebSocket',
        timestamp: formatTimestamp()
    };
    return registerPacket(packet);
}

export function createFilePacket(nomeArquivo, formato, remetente) {
    const packet = {
        key: generatePacketKey(),
        tipo: 'arquivo',
        nomeArquivo,
        formato,
        remetente,
        protocolo: 'FTP',
        timestamp: formatTimestamp()
    };
    return registerPacket(packet);
}

export function createProtocolPacket(nomeProtocolo, usuario, mensagem) {
    const protocoloUpper = nomeProtocolo.toUpperCase();
    const packet = {
        key: generatePacketKey(),
        tipo: 'protocolo',
        protocolo: protocoloUpper,
        usuario,
        mensagem: mensagem || `Simulação de pacote ${protocoloUpper}`,
        timestamp: formatTimestamp()
    };
    return registerPacket(packet);
}