

export function renderFisicaLayer(frame) {
    const container = document.getElementById('layer1Body');
    if (!container) return null;

    const frameString = JSON.stringify(frame);
    const crcCalculado = calcularCRC(frameString);
    const crcOriginal = frame.crc;

    const integridade = crcCalculado === crcOriginal;

    const frameJson = JSON.stringify(frame, null, 2);
    const bits = converterParaBinario(frameJson);

    const layer1 = document.getElementById('layer1');
    if (layer1) layer1.style.display = 'block';

    const frameDisplay = {
        frameId: frame.frameId,
        macOrigem: frame.macOrigem,
        macDestino: frame.macDestino,
        tipo: frame.tipo,
        crc: frame.crc,
        timestamp: frame.timestamp
    };

    const statusColor = integridade ? 'var(--color-success)' : 'var(--color-danger)';
    const statusIcon = integridade ? '✅' : '❌';
    const statusText = integridade ? 'Frame íntegro' : 'Frame corrompido!';

    container.innerHTML = `
        <!-- Frame original -->
        <div style="margin-bottom:var(--spacing-md);">
            <div style="font-size:0.7rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem;">
                📦 Frame Recebido da Camada de Enlace
            </div>
            <div class="code-block" style="font-size:0.75rem;">${formatarFrame(frameDisplay)}</div>
        </div>

        <!-- Verificação de integridade -->
        <div style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;padding:var(--spacing-md);background:rgba(0,0,0,0.05);border-radius:var(--radius-md);margin-bottom:var(--spacing-md);">
            <span>🔐 CRC Original: <strong>${frame.crc}</strong></span>
            <span>🔐 CRC Calculado: <strong>${crcCalculado}</strong></span>
            <span style="color:${statusColor};font-weight:bold;">${statusIcon} ${statusText}</span>
        </div>

        <!-- Binário -->
        <div>
            <div style="font-size:0.7rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem;">
                🔢 Dados em Binário (Camada Física)
            </div>
            <div class="code-block" style="font-size:0.65rem;word-break:break-all;max-height:300px;overflow-y:auto;">
                ${bits}
            </div>
            <div style="margin-top:0.3rem;font-size:0.65rem;color:var(--color-text-muted);">
                Total de bits: ${bits.replace(/\s/g, '').length} | ${Math.round(bits.replace(/\s/g, '').length / 8)} bytes
            </div>
        </div>

        <!-- Status final -->
        <div style="margin-top:var(--spacing-md);padding:var(--spacing-md);border-radius:var(--radius-md);border:1px solid ${statusColor};background:${integridade ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)'};">
            <div style="font-size:0.85rem;font-weight:600;color:${statusColor};">
                ${integridade ? '✅ Transmissão concluída com sucesso!' : '❌ Erro na transmissão! Frame corrompido.'}
            </div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.3rem;">
                ${integridade
            ? '📡 Dados enviados pelo meio físico (cabo, fibra, wi-fi). O frame chegou intacto ao destino.'
            : '⚠️ O frame foi corrompido durante a transmissão. Solicitar retransmissão.'}
            </div>
        </div>
    `;

    return {
        frame: frame,
        integridade: integridade,
        bits: bits,
        crcOriginal: crcOriginal,
        crcCalculado: crcCalculado
    };
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


function converterParaBinario(texto) {
    let resultado = '';
    for (let i = 0; i < texto.length; i++) {
        const charCode = texto.charCodeAt(i);
        const binario = charCode.toString(2).padStart(8, '0');
        resultado += binario + ' ';
        if ((i + 1) % 16 === 0) {
            resultado += '\n';
        }
    }
    return resultado.trim();
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