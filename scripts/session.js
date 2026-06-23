export function renderSessionLayer(presentationPacket) {
    const container = document.getElementById('layer5Body');
    if (!container) return null;

    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 60 * 1000);

    const sessao = {
        sessionId: crypto.randomUUID(),
        status: 'sessao_estabelecida',
        origem: presentationPacket.origem || 'Pedro Henrique',
        destino: 'Servidor OSI',
        camadaAnterior: 'Apresentação',
        tokenJWT: presentationPacket.tokenJWT.substring(0, 40) + '...',
        inicioSessao: now.toLocaleString('pt-BR'),
        expiraEm: expiry.toLocaleString('pt-BR')
    };

    // Mostra a camada
    document.getElementById('layer5').style.display = 'block';

    const fields = Object.keys(sessao);
    let code = 'const sessao = {\n';
    fields.forEach((prop, i) => {
        const comma = i === fields.length - 1 ? '' : ',';
        const isHighlight = prop === 'sessionId' || prop === 'status';
        const value = sessao[prop];
        const prefix = isHighlight ? '🔗 ' : '';
        code += `  ${prefix}${prop}: '${String(value)}'${comma}\n`;
    });
    code += '};';

    container.innerHTML = `
    <div class="code-block">${code}</div>
    <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--color-text-muted);">
      ⚡ Sessão estabelecida com sucesso. Comunicação pronta para envio.
    </div>
  `;

    return {
        ...sessao,
        protocolo: presentationPacket.protocolo,
        dadosOriginais: presentationPacket
    };
}