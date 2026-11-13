(async function () {
    const ctx = UI.iniciar({ perfis: ['TUTOR'], pagina: 'solicitacoes.html', titulo: 'Minhas solicitações', sub: 'Histórico e situação de cada solicitação de castração.' });
    if (!ctx) return;
    const c = ctx.conteudo; let lista = [], filtro = 'TODAS';
    ctx.acoes.innerHTML = UI.atalho('solicitar.html', 'plus', 'Nova solicitação', 'btn btn-primary'); U.icones();

    async function cancelar(s) {
        if (!(await UI.confirmar({ titulo: 'Cancelar solicitação', texto: `Cancelar a solicitação de ${s.animal_nome} para ${UI.data(s.data)} às ${s.horario}? A vaga será liberada.`, rotulo: 'Cancelar solicitação', perigo: true }))) return;
        UI.executar(await Api.put('/solicitacoes/' + s.id + '/status', { status: 'CANCELADO' }), carregar);
    }
    async function excluir(s) {
        if (!(await UI.confirmar({ titulo: 'Excluir registro', texto: `Excluir da lista a solicitação de ${s.animal_nome}? Esta ação não pode ser desfeita.`, rotulo: 'Excluir', perigo: true }))) return;
        UI.executar(await Api.del('/solicitacoes/' + s.id), carregar);
    }
    function tabela() {
        const v = lista.filter((x) => filtro === 'TODAS' || x.status === filtro);
        const alvo = document.getElementById('lista');
        if (!v.length) { alvo.innerHTML = UI.vazio('inbox', 'Nenhuma solicitação nesta situação', 'Escolha outro filtro para ver as demais.'); U.icones(); return; }
        alvo.innerHTML = UI.tabela([
            { h: 'Animal', f: (r) => `<strong>${UI.esc(r.animal_nome)}</strong><small>${UI.ESPECIE[r.especie] || ''}</small>` },
            { h: 'Solicitada em', f: (r) => UI.dataHora(r.data_solicitacao) },
            { h: 'Atendimento', f: (r) => `${UI.data(r.data)}<small>às ${r.horario}</small>` },
            { h: 'Situação', f: (r) => UI.badge(r.status) + (r.status === 'RECUSADO' && r.justificativa_recusa ? `<small>Motivo: ${UI.esc(r.justificativa_recusa)}</small>` : '') },
            { h: 'Ações', f: (r) => `<div class="row-actions">${['PENDENTE', 'APROVADO'].includes(r.status) ? `<button class="btn btn-secondary btn-sm" type="button" data-c="${r.id}">Cancelar</button>` : ''}${['RECUSADO', 'CANCELADO'].includes(r.status) ? `<button class="btn btn-ghost btn-sm" type="button" data-x="${r.id}"><i data-icon="trash-2"></i>Excluir</button>` : ''}${['APROVADO', 'CHECKIN'].includes(r.status) ? UI.atalho('guia.html', 'file-text', 'Guia', 'btn btn-ghost btn-sm') : ''}</div>` }
        ], v);
        const por = (id) => lista.find((x) => x.id === Number(id));
        alvo.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => cancelar(por(b.dataset.c)));
        alvo.querySelectorAll('[data-x]').forEach((b) => b.onclick = () => excluir(por(b.dataset.x)));
        U.icones();
    }
    async function carregar() {
        c.innerHTML = UI.skeleton(4);
        const r = await Api.get('/solicitacoes');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        lista = [...r.data].sort((a, b) => b.id - a.id);
        if (!lista.length) { c.innerHTML = UI.vazio('clipboard-list', 'Nenhuma solicitação ainda', 'Quando você solicitar a castração de um animal, o acompanhamento aparece aqui.', UI.atalho('solicitar.html', 'plus', 'Solicitar castração', 'btn btn-primary')); U.icones(); return; }
        const n = (st) => lista.filter((x) => x.status === st).length;
        c.innerHTML = `<section class="panel"><div class="panel-b"><div class="chips" role="group" aria-label="Filtrar por situação">${['TODAS', ...Object.keys(UI.ROTULO)].map((st) => `<button class="chip" type="button" data-f="${st}" aria-pressed="${st === filtro}">${st === 'TODAS' ? 'Todas' : UI.ROTULO[st]}<small>${st === 'TODAS' ? lista.length : n(st)}</small></button>`).join('')}</div></div><div id="lista"></div></section>`;
        c.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { filtro = b.dataset.f; c.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); tabela(); });
        tabela();
    }
    carregar();
})();
