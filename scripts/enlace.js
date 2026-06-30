
export function renderEnlaceLayer(networkPacket) {
    const container = document.getElementById('layer2Body');
    if (!container) return null;

    const macOrigem = gerarMacOrigem();

    const macDestino = gerarMacDestino();

    const frame = {
        frameId: gerarFrameId(),
        macOrigem: macOrigem,
        macDestino: macDestino,
        tipo: 'IPv4',
        dados: networkPacket,
        timestamp: new Date().toISOString()
    };

    const frameString = JSON.stringify(frame);
    frame.crc = calcularCRC(frameString);

    const frameDisplay = {
        frameId: frame.frameId,
        macOrigem: frame.macOrigem,
        macDestino: frame.macDestino,
        tipo: frame.tipo,
        crc: frame.crc,
        timestamp: frame.timestamp,
        dados: {
            ipOrigem: networkPacket.ipOrigem || '10.0.0.?',
            ipDestino: networkPacket.ipDestino || '10.0.0.?',
            algoritmo: networkPacket.algoritmo || 'dijkstra',
            rota: networkPacket.rota || []
        }
    };

    const layer2 = document.getElementById('layer2');
    if (layer2) layer2.style.display = 'block';


    const code = formatarFrame(frameDisplay);

    container.innerHTML = `
        <div class="code-block">${code}</div>
        <div style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;font-size:0.85rem;margin-top:0.5rem;padding:var(--spacing-sm) var(--spacing-md);background:rgba(0,0,0,0.05);border-radius:var(--radius-md);">
            <span>📋 Frame ID: <strong>${frame.frameId}</strong></span>
            <span>📌 MAC Origem: <strong style="color:var(--layer-2-color);">${frame.macOrigem}</strong></span>
            <span>📌 MAC Destino: <strong style="color:var(--layer-2-color);">${frame.macDestino}</strong></span>
            <span>🔐 CRC: <strong style="color:var(--color-warning);">${frame.crc.substring(0, 12)}...</strong></span>
        </div>
        <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--color-text-muted);">
            📦 Frame criado na Camada de Enlace. Encaminhando para a Camada Física.
        </div>
    `;


    return frame;
}


function gerarMacOrigem() {
    const nome = 'Antonio Carlos';
    const hash = simpleHash(nome);

    const bytes = [];
    for (let i = 0; i < 6; i++) {
        bytes.push((hash + i * 13) % 256);
    }
    bytes[0] = (bytes[0] & 0xFE) | 0x02;

    return bytes.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
}


function gerarMacDestino() {
    const bytes = [];
    for (let i = 0; i < 6; i++) {
        bytes.push(Math.floor(Math.random() * 256));
    }
    bytes[0] = (bytes[0] & 0xFE) | 0x02;

    return bytes.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
}


function gerarFrameId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `F${timestamp}_${random}`.toUpperCase();
}


function calcularCRC(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}


function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}


function formatarFrame(frame) {
    const fields = Object.keys(frame);
    let code = 'const frame = {\n';
    fields.forEach((prop, i) => {
        const comma = i === fields.length - 1 ? '' : ',';
        const value = frame[prop];
        const isNumeric = typeof value === 'number';
        const isObject = typeof value === 'object' && value !== null;

        if (isObject) {
            const objStr = JSON.stringify(value, null, 2).replace(/\n/g, '\n    ');
            code += `  ${prop}: ${objStr}${comma}\n`;
        } else {
            code += `  ${prop}: ${isNumeric ? value : `'${String(value)}'`}${comma}\n`;
        }
    });
    code += '};';
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}