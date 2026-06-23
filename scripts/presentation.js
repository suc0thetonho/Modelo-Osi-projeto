const SENSITIVE_FIELDS = {
    chat: ['usuario', 'mensagem'],
    site: ['hostIP', 'usuario'],
    email: ['remetente', 'destinatario', 'assunto', 'corpo'],
    arquivo: ['nomeArquivo', 'remetente'],
    protocolo: ['usuario', 'mensagem', 'protocolo']
};

const TYPE_LABELS = {
    chat: { number: 1, label: 'CHAT' },
    site: { number: 2, label: 'SITES' },
    email: { number: 3, label: 'E-MAIL' },
    arquivo: { number: 4, label: 'ARQUIVOS' },
    protocolo: { number: 5, label: 'PROTOCOLO' }
};

let _joseModule = null;

async function loadJose() {
    if (!_joseModule) {
        _joseModule = await import('https://cdn.jsdelivr.net/npm/jose@6/+esm');
    }
    return _joseModule;
}

async function generateJWT(packet, sensitiveFields) {
    const { SignJWT } = await loadJose();
    const secret = new TextEncoder().encode('chave-secreta-didatica-osi');
    const payload = {};
    for (const field of sensitiveFields) {
        if (packet[field] !== undefined) {
            payload[field] = packet[field];
        }
    }
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(secret);
    return token;
}

function decodeJWTParts(token) {
    try {
        const parts = token.split('.');
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        return { header, payload };
    } catch {
        return { header: {}, payload: {} };
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export async function renderPresentationLayer(packet) {
    const container = document.getElementById('layer6Body');
    if (!container) return null;

    const tipo = packet.tipo;
    const meta = TYPE_LABELS[tipo];
    if (!meta) return null;

    const sensitiveList = SENSITIVE_FIELDS[tipo] || [];
    const tokenJWT = await generateJWT(packet, sensitiveList);
    const { header, payload } = decodeJWTParts(tokenJWT);

    // Mostra a camada
    document.getElementById('layer6').style.display = 'block';

    const apresentacao = {
        tipo: packet.tipo,
        protocolo: packet.protocolo,
        dadosProtegidosJWT: tokenJWT.substring(0, 40) + '...',
        timestamp: packet.timestamp
    };

    const fields = Object.keys(apresentacao);
    let code = 'const apresentacao = {\n';
    fields.forEach((prop, i) => {
        const comma = i === fields.length - 1 ? '' : ',';
        const value = apresentacao[prop];
        code += `  ${prop}: '${escapeHtml(String(value))}'${comma}\n`;
    });
    code += '};';

    container.innerHTML = `
    <div class="code-block">${escapeHtml(code)}</div>
    
    <div class="jwt-details">
      <div class="jwt-section">
        <div class="jwt-label">📋 Header do JWT</div>
        <div class="jwt-value">${escapeHtml(JSON.stringify(header, null, 2))}</div>
      </div>
      <div class="jwt-section" style="margin-top:0.5rem;">
        <div class="jwt-label">📦 Payload decodificado</div>
        <div class="jwt-value">${escapeHtml(JSON.stringify(payload, null, 2))}</div>
      </div>
      <div class="jwt-section" style="margin-top:0.5rem;">
        <div class="jwt-label">🔐 Token JWT completo</div>
        <div class="jwt-value" style="font-size:0.65rem;word-break:break-all;">${escapeHtml(tokenJWT)}</div>
      </div>
      <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--color-text-muted);">
        🛡️ Dados sensíveis protegidos com JWT (assinado HS256)
      </div>
    </div>
  `;

    return {
        tipo: packet.tipo,
        protocolo: packet.protocolo,
        tokenJWT: tokenJWT,
        timestamp: packet.timestamp,
        origem: packet.usuario || packet.remetente || 'Pedro Henrique',
        dadosOriginais: packet
    };
}