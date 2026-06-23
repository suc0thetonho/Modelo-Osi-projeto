const PROTOCOLO_PORTA_MAP = {
    'HTTP': 80,
    'HTTPS': 443,
    'HTTP/HTTPS': 443,
    'HTTPS': 443,
    'WebSocket': 80,
    'SMTP': 587,
    'FTP': 21,
    'TCP': 80,
    'UDP': 53,
    'SSH': 22,
    'Telnet': 23,
    'DNS': 53,
    'DHCP': 67,
    'POP3': 110,
    'IMAP': 143
};

function gerarPortaOrigem() {
    return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}

function obterPortaDestino(protocolo) {
    // Remove espaços e converte para maiúsculas
    const protoClean = protocolo.trim().toUpperCase();
    return PROTOCOLO_PORTA_MAP[protoClean] || 80;
}

export function renderTransportLayer(sessionPacket) {
    const container = document.getElementById('layer4Body');
    if (!container) return null;

    const protocolo = sessionPacket.protocolo || sessionPacket.dadosOriginais?.protocolo || 'HTTP';

    const transporte = {
        sessionId: sessionPacket.sessionId,
        packetId: crypto.randomUUID(),
        protocoloTransporte: 'TCP',
        portaOrigem: gerarPortaOrigem(),
        portaDestino: obterPortaDestino(protocolo)
    };

    // Mostra a camada
    document.getElementById('layer4').style.display = 'block';

    const fields = Object.keys(transporte);
    let code = 'const transporte = {\n';
    fields.forEach((prop, i) => {
        const comma = i === fields.length - 1 ? '' : ',';
        const value = transporte[prop];
        const isNumeric = typeof value === 'number';
        const prefix = prop === 'sessionId' || prop === 'packetId' ? '📦 ' : '';
        code += `  ${prefix}${prop}: ${isNumeric ? value : `'${value}'`}${comma}\n`;
    });
    code += '};';

    container.innerHTML = `
    <div class="code-block">${code}</div>
    <div style="display:flex;gap:var(--spacing-lg);margin-top:0.5rem;flex-wrap:wrap;font-size:0.85rem;">
      <span>⬆️ Porta Origem: <strong>${transporte.portaOrigem}</strong> <span style="font-size:0.65rem;color:var(--color-text-muted);">(efêmera)</span></span>
      <span>⬇️ Porta Destino: <strong>${transporte.portaDestino}</strong> <span style="font-size:0.65rem;color:var(--color-text-muted);">(${protocolo})</span></span>
    </div>
    <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--color-text-muted);">
      📡 Segmento TCP criado. Encaminhando para a Camada de Rede.
    </div>
  `;

    return {
        ...transporte,
        protocolo: protocolo,
        dadosOriginais: sessionPacket
    };
}