import * as application from './application.js';
import * as presentation from './presentation.js';
import * as session from './session.js';
import * as transport from './transport.js';
import * as network from './network.js';
import { points } from './points.js';

const textInput = document.getElementById('textInput');
const fileInput = document.getElementById('fileInput');
const requestBtn = document.getElementById('requestBtn');
const emailFields = document.getElementById('emailFields');
const emailSubject = document.getElementById('emailSubject');
const emailBody = document.getElementById('emailBody');
const protocolName = document.getElementById('protocolName');
const protocolStatus = document.getElementById('protocolStatus');
const flowIndicator = document.getElementById('flowIndicator');
const flowBar = document.getElementById('flowBar');

textInput.addEventListener('input', () => {
    const value = textInput.value.trim();
    if (value.includes('@')) {
        emailFields.style.display = 'grid';
    } else {
        emailFields.style.display = 'none';
    }
});

function clearLayers() {
    ['layer7', 'layer6', 'layer5', 'layer4', 'layer3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    ['layer7Body', 'layer6Body', 'layer5Body', 'layer4Body', 'layer3Body'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    if (flowIndicator) flowIndicator.style.display = 'none';
    if (flowBar) flowBar.style.width = '0%';
}

function updateProtocol(text) {
    if (protocolName) protocolName.textContent = text || '—';
    if (protocolStatus) protocolStatus.textContent = text ? `Protocolo: ${text}` : 'Aguardando...';
}

function updateFlow(progress, label) {
    if (!flowIndicator || !flowBar) return;
    flowIndicator.style.display = 'block';
    flowBar.style.width = `${progress}%`;
    if (label) {
        const flowText = flowIndicator.querySelector('.flow-text');
        if (flowText) flowText.textContent = label;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processPacket(packet) {
    console.log('📦 Processando pacote:', packet);

    clearLayers();

    try {
        updateFlow(10, '⬇ Camada 7 - Aplicação');
        const appContainer = document.getElementById('layer7Body');
        const layer7 = document.getElementById('layer7');
        if (appContainer && layer7) {
            layer7.style.display = 'block';
            const appFields = Object.keys(packet);
            let appCode = 'const pacote = {\n';
            appFields.forEach((prop, i) => {
                const comma = i === appFields.length - 1 ? '' : ',';
                const value = packet[prop];
                const isNumeric = typeof value === 'number';
                appCode += `  ${prop}: ${isNumeric ? value : `'${String(value)}'`}${comma}\n`;
            });
            appCode += '};';
            appContainer.innerHTML = `
                <div class="code-block">${appCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.5rem;">
                    📦 Pacote criado na Camada de Aplicação. Protocolo: ${packet.protocolo}
                </div>
            `;
        }
        await sleep(300);

        updateFlow(30, '⬇ Camada 6 - Apresentação (JWT)');
        console.log('🔄 Renderizando apresentação...');
        const presentationPacket = await presentation.renderPresentationLayer(packet);
        console.log('✅ Apresentação concluída:', presentationPacket);
        await sleep(300);

        updateFlow(50, '⬇ Camada 5 - Sessão');
        console.log('🔄 Renderizando sessão...');
        const sessionPacket = session.renderSessionLayer(presentationPacket);
        console.log('✅ Sessão concluída:', sessionPacket);
        await sleep(300);

        updateFlow(70, '⬇ Camada 4 - Transporte (TCP)');
        console.log('🔄 Renderizando transporte...');
        const transportPacket = transport.renderTransportLayer(sessionPacket);
        console.log('✅ Transporte concluído:', transportPacket);
        await sleep(300);

        updateFlow(90, '⬇ Camada 3 - Rede (Roteamento)');
        console.log('🔄 Renderizando rede...');

        const ativos = points.filter(p => p.ativo);
        console.log('📍 Roteadores ativos:', ativos.length);

        const origem = ativos[0]?.id || 'R1';
        const destino = ativos[ativos.length - 1]?.id || 'R64';
        console.log('📍 Origem:', origem, '🎯 Destino:', destino);

        network.renderNetworkLayer(transportPacket, origem, destino, 'dijkstra');
        console.log('✅ Rede concluída');

        updateFlow(100, '✅ Encapsulamento completo!');
        await sleep(300);
        if (flowIndicator) flowIndicator.style.display = 'none';

    } catch (error) {
        console.error('❌ Erro no processamento:', error);
        alert('Ocorreu um erro ao processar o pacote. Verifique o console para mais detalhes.');
        if (flowIndicator) flowIndicator.style.display = 'none';
    }
}

// ===== HANDLE REQUEST =====
async function handleRequest() {
    const text = textInput.value.trim();
    const file = fileInput.files[0];

    console.log('📥 Entrada:', { text, file: file ? file.name : 'nenhum' });

    if (!text && !file) {
        alert('Digite uma mensagem, URL, e-mail, protocolo (ex: TCP, UDP, SMTP, HTTPS) ou selecione um arquivo.');
        return;
    }

    const protocolType = application.detectProtocol(text, !!file);
    console.log('🔍 Protocolo detectado:', protocolType);

    if (!protocolType) {
        alert('Não foi possível detectar o tipo de dado. Tente novamente.');
        return;
    }

    updateProtocol(application.getProtocolLabel(protocolType));

    let packet = null;

    if (protocolType.startsWith('protocol_')) {
        const protocoloName = protocolType.replace('protocol_', '');
        packet = application.createProtocolPacket(protocoloName, application.USER_NAME, text);
        console.log('📦 Pacote de protocolo criado:', packet);
        await processPacket(packet);
        return;
    }

    if (protocolType === 'email') {
        const assunto = emailSubject.value.trim() || '(sem assunto)';
        const corpo = emailBody.value.trim() || '(sem corpo)';
        packet = application.createEmailPacket(text, text, assunto, corpo);
        console.log('📦 Pacote de e-mail criado:', packet);
        await processPacket(packet);
        return;
    }

    if (protocolType === 'http') {
        packet = application.createHttpPacket(text, application.USER_NAME);
        console.log('📦 Pacote HTTP criado:', packet);
        await processPacket(packet);
        return;
    }

    if (protocolType === 'chat') {
        packet = application.createChatPacket(text, application.USER_NAME);
        console.log('📦 Pacote de chat criado:', packet);
        await processPacket(packet);
        return;
    }

    if (protocolType === 'file' && file) {
        const ext = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'DESCONHECIDO';
        packet = application.createFilePacket(file.name, ext, application.USER_NAME);
        console.log('📦 Pacote de arquivo criado:', packet);
        await processPacket(packet);
        fileInput.value = '';
        return;
    }
}

requestBtn.addEventListener('click', handleRequest);

textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        requestBtn.click();
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        textInput.value = '';
        updateProtocol('Arquivo (FTP)');
    }
});

updateProtocol('Aguardando...');
console.log('✅ OSI Flow inicializado!');