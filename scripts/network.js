import { points } from './points.js';

const networkContainer = document.getElementById('layer3Body');
let canvas = null;
let ctx = null;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function buildPointsMap(pontosArray) {
    const map = {};
    for (const p of pontosArray) {
        map[p.id] = p;
    }
    return map;
}

function distanciaEuclidiana(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function dijkstra(origemId, destinoId, pontosArray) {
    const mapa = buildPointsMap(pontosArray);
    const origem = mapa[origemId];
    const destino = mapa[destinoId];
    if (!origem || !destino) return { rota: [], custoTotal: 0, visitados: [], naoUtilizados: [] };

    const dist = {};
    const anterior = {};
    const visitados = new Set();
    const naoVisitados = new Set();

    for (const p of pontosArray) {
        if (p.ativo) {
            dist[p.id] = Infinity;
            naoVisitados.add(p.id);
        }
    }
    dist[origemId] = 0;

    while (naoVisitados.size > 0) {
        let atual = null;
        let menorDist = Infinity;
        for (const id of naoVisitados) {
            if (dist[id] < menorDist) {
                menorDist = dist[id];
                atual = id;
            }
        }
        if (atual === null || atual === destinoId) break;
        naoVisitados.delete(atual);
        visitados.add(atual);
        const pAtual = mapa[atual];
        if (!pAtual) continue;

        for (const vizinhoId of pAtual.conexoes) {
            const vizinho = mapa[vizinhoId];
            if (!vizinho || !vizinho.ativo || !naoVisitados.has(vizinhoId)) continue;
            const peso = distanciaEuclidiana(pAtual, vizinho);
            const novaDist = dist[atual] + peso;
            if (novaDist < dist[vizinhoId]) {
                dist[vizinhoId] = novaDist;
                anterior[vizinhoId] = atual;
            }
        }
    }

    const rota = [];
    let step = destinoId;
    while (step !== undefined) {
        rota.unshift(step);
        step = anterior[step];
    }
    if (rota[0] !== origemId) {
        return { rota: [], custoTotal: 0, visitados: Array.from(visitados), naoUtilizados: [] };
    }

    visitados.add(destinoId);
    const rotaSet = new Set(rota);
    const naoUtilizados = Array.from(visitados).filter(id => !rotaSet.has(id));

    return {
        rota,
        custoTotal: Math.round((dist[destinoId] || 0) * 100) / 100,
        visitados: Array.from(visitados),
        naoUtilizados
    };
}

export function greedy(origemId, destinoId, pontosArray) {
    const mapa = buildPointsMap(pontosArray);
    const destino = mapa[destinoId];
    if (!mapa[origemId] || !destino) return { rota: [], custoTotal: 0, visitados: [], naoUtilizados: [] };

    const rota = [origemId];
    const visitados = new Set([origemId]);
    let custoTotal = 0;
    let atual = origemId;

    while (atual !== destinoId) {
        const pAtual = mapa[atual];
        if (!pAtual) break;
        const vizinhosDisponiveis = pAtual.conexoes.filter(id => {
            const v = mapa[id];
            return v && v.ativo && !visitados.has(id);
        });
        if (vizinhosDisponiveis.length === 0) break;

        let melhorVizinho = null;
        let menorDistancia = Infinity;
        for (const vizId of vizinhosDisponiveis) {
            const vizinho = mapa[vizId];
            const dist = distanciaEuclidiana(vizinho, destino);
            if (dist < menorDistancia) {
                menorDistancia = dist;
                melhorVizinho = vizId;
            }
        }
        if (!melhorVizinho) break;
        custoTotal += distanciaEuclidiana(pAtual, mapa[melhorVizinho]);
        visitados.add(melhorVizinho);
        rota.push(melhorVizinho);
        atual = melhorVizinho;
    }

    if (atual !== destinoId) {
        return { rota: [], custoTotal: 0, visitados: Array.from(visitados), naoUtilizados: [] };
    }

    return {
        rota,
        custoTotal: Math.round(custoTotal * 100) / 100,
        visitados: Array.from(visitados),
        naoUtilizados: []
    };
}

function desenharCanvas(resultado, origemId, destinoId, pontosArray) {
    if (!canvas) {
        canvas = document.getElementById('networkCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
    }

    const wrapper = canvas.parentElement;
    const canvasWidth = wrapper.clientWidth || 900;
    const canvasHeight = 450;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    for (const p of pontosArray) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const padding = 40;
    const scaleX = (canvasWidth - padding * 2) / (maxX - minX || 1);
    const scaleY = (canvasHeight - padding * 2) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvasWidth - (maxX - minX) * scale) / 2;
    const offsetY = (canvasHeight - (maxY - minY) * scale) / 2;

    function toCanvas(p) {
        return {
            cx: (p.x - minX) * scale + offsetX,
            cy: (p.y - minY) * scale + offsetY
        };
    }

    const mapa = buildPointsMap(pontosArray);
    const rotaSet = new Set(resultado.rota);
    const naoUtilizadosSet = new Set(resultado.naoUtilizados);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const desenhadas = new Set();
    for (const p of pontosArray) {
        const posA = toCanvas(p);
        for (const vizId of p.conexoes) {
            const chave = [p.id, vizId].sort().join('-');
            if (desenhadas.has(chave)) continue;
            desenhadas.add(chave);
            const viz = mapa[vizId];
            if (!viz) continue;
            const posB = toCanvas(viz);

            const ambosNaRota = rotaSet.has(p.id) && rotaSet.has(vizId);
            const idxA = resultado.rota.indexOf(p.id);
            const idxB = resultado.rota.indexOf(vizId);
            const conexaoNaRota = ambosNaRota && Math.abs(idxA - idxB) === 1;

            if (conexaoNaRota) {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                ctx.lineWidth = 2.5;
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 0.5;
            }
            ctx.beginPath();
            ctx.moveTo(posA.cx, posA.cy);
            ctx.lineTo(posB.cx, posB.cy);
            ctx.stroke();
        }
    }

    for (const p of pontosArray) {
        const pos = toCanvas(p);
        const radius = 6;

        if (!p.ativo) {
            ctx.fillStyle = 'rgba(100,100,100,0.2)';
            ctx.strokeStyle = 'rgba(100,100,100,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.cx, pos.cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            const s = 4;
            ctx.beginPath();
            ctx.moveTo(pos.cx - s, pos.cy - s);
            ctx.lineTo(pos.cx + s, pos.cy + s);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos.cx + s, pos.cy - s);
            ctx.lineTo(pos.cx - s, pos.cy + s);
            ctx.stroke();
            continue;
        }

        if (p.id === origemId) {
            ctx.fillStyle = '#22c55e';
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pos.cx, pos.cy, radius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ORIGEM', pos.cx, pos.cy - 14);
        } else if (p.id === destinoId) {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pos.cx, pos.cy, radius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DESTINO', pos.cx, pos.cy - 14);
        } else if (naoUtilizadosSet.has(p.id)) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.cx, pos.cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // X vermelho pequeno
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            const s = 3;
            ctx.beginPath();
            ctx.moveTo(pos.cx - s, pos.cy - s);
            ctx.lineTo(pos.cx + s, pos.cy + s);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos.cx + s, pos.cy - s);
            ctx.lineTo(pos.cx - s, pos.cy + s);
            ctx.stroke();
        } else if (rotaSet.has(p.id)) {
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pos.cx, pos.cy, radius + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.cx, pos.cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '6px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.id, pos.cx, pos.cy + radius + 10);
    }

    if (resultado.rota.length > 1) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const first = toCanvas(mapa[resultado.rota[0]]);
        ctx.moveTo(first.cx, first.cy);
        for (let i = 1; i < resultado.rota.length; i++) {
            const p = toCanvas(mapa[resultado.rota[i]]);
            ctx.lineTo(p.cx, p.cy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    let y = canvasHeight - 30;
    ctx.fillText('● Ativo', 10, y);
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.fillText('● Inativo', 80, y);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● Origem', 160, y);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('● Destino', 240, y);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('● Rota', 320, y);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.fillText('● Visitado', 390, y);
}

export function popularControles() {
    const selectOrigem = document.getElementById('select-origem');
    const selectDestino = document.getElementById('select-destino');
    if (!selectOrigem || !selectDestino) return;

    const ativos = points.filter(p => p.ativo).sort((a, b) => {
        const numA = parseInt(a.id.replace('R', ''));
        const numB = parseInt(b.id.replace('R', ''));
        return numA - numB;
    });

    selectOrigem.innerHTML = '';
    selectDestino.innerHTML = '';
    for (const p of ativos) {
        const optO = document.createElement('option');
        optO.value = p.id;
        optO.textContent = `${p.id} — ${p.nome} (${p.ip})`;
        selectOrigem.appendChild(optO);
        const optD = document.createElement('option');
        optD.value = p.id;
        optD.textContent = `${p.id} — ${p.nome} (${p.ip})`;
        selectDestino.appendChild(optD);
    }

    if (ativos.length >= 2) {
        selectOrigem.value = ativos[0].id;
        selectDestino.value = ativos[ativos.length - 1].id;
    }
}

export function renderNetworkLayer(transportPacket, origemId, destinoId, algoritmo) {
    const container = document.getElementById('layer3Body');
    if (!container) return null;

    const resDijkstra = dijkstra(origemId, destinoId, points);
    const resGreedy = greedy(origemId, destinoId, points);
    const resultado = algoritmo === 'greedy' ? resGreedy : resDijkstra;

    const mapa = buildPointsMap(points);
    const origemRouter = mapa[origemId];
    const destinoRouter = mapa[destinoId];

    const networkObj = {
        ipOrigem: origemRouter ? origemRouter.ip : '10.0.0.?',
        ipDestino: destinoRouter ? destinoRouter.ip : '10.0.0.?',
        algoritmo: algoritmo,
        rota: resultado.rota,
        custoTotal: resultado.custoTotal,
        ttl: resultado.rota.length > 0 ? resultado.rota.length - 1 : 0
    };

    document.getElementById('layer3').style.display = 'block';

    const statusRota = resultado.rota.length > 0 ? `✅ ${resultado.rota.length - 1} saltos` : '❌ Sem rota';

    const controlsHTML = `
    <div class="network-controls">
      <div class="network-control-group">
        <label class="network-control-label">📍 Origem</label>
        <select id="select-origem" class="network-select"></select>
      </div>
      <div class="network-control-group">
        <label class="network-control-label">🎯 Destino</label>
        <select id="select-destino" class="network-select"></select>
      </div>
      <div class="network-control-group">
        <label class="network-control-label">⚙️ Algoritmo</label>
        <select id="select-algoritmo" class="network-select">
          <option value="dijkstra" ${algoritmo === 'dijkstra' ? 'selected' : ''}>Dijkstra (Caminho Ótimo)</option>
          <option value="greedy" ${algoritmo === 'greedy' ? 'selected' : ''}>Greedy / Guloso</option>
        </select>
      </div>
      <div class="network-control-group" style="flex:0 0 auto;">
        <label class="network-control-label" style="opacity:0;">Calcular</label>
        <button id="btnCalcularRota" class="btn btn-primary">📊 Calcular Rota</button>
      </div>
    </div>
  `;

    const canvasHTML = `
    <div class="canvas-wrapper">
      <canvas id="networkCanvas"></canvas>
    </div>
  `;

    const routeInfo = resultado.rota.length > 0 ? resultado.rota.join(' → ') : 'Nenhuma rota encontrada';

    const dijkstraOk = resDijkstra.rota.length > 0;
    const greedyOk = resGreedy.rota.length > 0;

    const comparisonHTML = `
    <div style="margin-top:var(--spacing-md);">
      <h4 style="font-weight:600;font-size:0.95rem;margin-bottom:var(--spacing-sm);">📊 Comparação de Algoritmos</h4>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Dijkstra</th>
            <th>Greedy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Status</td>
            <td class="${dijkstraOk ? 'status-ok' : 'status-fail'}">${dijkstraOk ? '✅ Encontrada' : '❌ Sem rota'}</td>
            <td class="${greedyOk ? 'status-ok' : 'status-fail'}">${greedyOk ? '✅ Encontrada' : '❌ Sem rota'}</td>
          </tr>
          <tr>
            <td>Custo Total</td>
            <td>${dijkstraOk ? resDijkstra.custoTotal.toFixed(2) : '—'}</td>
            <td>${greedyOk ? resGreedy.custoTotal.toFixed(2) : '—'}</td>
          </tr>
          <tr>
            <td>Nº de Saltos</td>
            <td>${dijkstraOk ? (resDijkstra.rota.length - 1) : '—'}</td>
            <td>${greedyOk ? (resGreedy.rota.length - 1) : '—'}</td>
          </tr>
          <tr>
            <td>Nós Visitados</td>
            <td>${resDijkstra.visitados.length}</td>
            <td>${resGreedy.visitados.length}</td>
          </tr>
          <tr>
            <td>Rota</td>
            <td class="rota-cell">${dijkstraOk ? resDijkstra.rota.join(' → ') : '—'}</td>
            <td class="rota-cell">${greedyOk ? resGreedy.rota.join(' → ') : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

    container.innerHTML = `
    <div class="code-block" style="margin-bottom:var(--spacing-md);">
      const rede = {
        ipOrigem: '${networkObj.ipOrigem}',
        ipDestino: '${networkObj.ipDestino}',
        algoritmo: '${networkObj.algoritmo}',
        rota: [${networkObj.rota.join(', ')}],
        custoTotal: ${networkObj.custoTotal},
        ttl: ${networkObj.ttl}
      };
    </div>
    <div style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;font-size:0.85rem;margin-bottom:var(--spacing-md);">
      <span>📍 Origem: <strong>${origemId}</strong> (${origemRouter?.ip || '?'})</span>
      <span>🎯 Destino: <strong>${destinoId}</strong> (${destinoRouter?.ip || '?'})</span>
      <span>📏 Custo: <strong>${networkObj.custoTotal}</strong> | TTL: <strong>${networkObj.ttl}</strong> | ${statusRota}</span>
      <span>🛣️ Rota: <strong style="font-family:var(--font-mono);font-size:0.75rem;">${routeInfo}</strong></span>
    </div>
    ${controlsHTML}
    ${canvasHTML}
    ${comparisonHTML}
    <div style="margin-top:var(--spacing-md);font-size:0.75rem;color:var(--color-text-muted);">
      ⚡ Pacote IP montado. Algoritmo <strong style="color:var(--layer-3-color);">${algoritmo}</strong> calculou a rota.
    </div>
  `;

    popularControles();

    const btnCalcular = document.getElementById('btnCalcularRota');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            const origem = document.getElementById('select-origem').value;
            const destino = document.getElementById('select-destino').value;
            const alg = document.getElementById('select-algoritmo').value;
            if (origem === destino) {
                alert('Selecione roteadores diferentes.');
                return;
            }
            renderNetworkLayer(transportPacket, origem, destino, alg);
        });
    }

    setTimeout(() => {
        const canvasEl = document.getElementById('networkCanvas');
        if (canvasEl) {
            canvas = canvasEl;
            ctx = canvasEl.getContext('2d');
            desenharCanvas(resultado, origemId, destinoId, points);
        }
    }, 50);

    return networkObj;
}