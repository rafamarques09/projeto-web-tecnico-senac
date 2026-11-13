(async function () {
    const ctx = UI.iniciar({ perfis: ['ADMIN'], pagina: 'triagem.html', titulo: 'Triagem de solicitações', sub: 'Analise, aprove ou recuse as solicitações de castração.' });
    if (!ctx) return;
    const c = ctx.conteudo; let lista = [], filtro = 'PENDENTE';

    async function aprovar(s) {
        if (!(await UI.confirmar({ titulo: 'Aprovar solicitação', texto: `Aprovar a castração de ${s.animal_nome} (tutor: ${s.tutor_nome}) em ${UI.data(s.data)} às ${s.horario}?`, rotulo: 'Aprovar' }))) return;
        UI.executar(await Api.put('/solicitacoes/' + s.id + '/status', { status: 'APROVADO' }), carregar);
    }
    function recusar(s) {
        UI.modal({
            titulo: 'Recusar solicitação', rotulo: 'Recusar solicitação', perigo: true,
            corpo: `<p style="margin-top:0">Solicitação de <strong>${UI.esc(s.animal_nome)}</strong> (${UI.esc(s.tutor_nome)}). O tutor poderá ver a justificativa.</p>` + UI.campo('just', 'Justificativa da recusa', '<textarea class="input" id="just" maxlength="255"></textarea>', { req: true, hint: 'De 5 a 255 caracteres.' }),
            aoEnviar: async (form) => {
                const t = form.querySelector('#just'), v = t.value.trim();
                U.erroCampo(t, v.length < 5 ? 'Informe uma justificativa com pelo menos 5 caracteres.' : '');
                if (v.length < 5) return false;
                const r = await Api.put('/solicitacoes/' + s.id + '/status', { status: 'RECUSADO', justificativa: v });
                if (!r.ok) return { erro: r.message };
                UI.executar(r, carregar);
            }
        });
    }
    function cartoes() {
        const v = lista.filter((x) => filtro === 'TODAS' || x.status === filtro), alvo = document.getElementById('lista');
        if (!v.length) { alvo.innerHTML = UI.vazio('inbox', filtro === 'PENDENTE' ? 'Nenhuma solicitação pendente' : 'Nada por aqui', filtro === 'PENDENTE' ? 'Todas as solicitações já foram analisadas.' : 'Nenhuma solicitação nesta situação.'); U.icones(); return; }
        alvo.innerHTML = `<div class="cards">${v.map((s) => `<article class="card">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><h3>${UI.esc(s.animal_nome)}</h3><span class="muted" style="font-size:.875rem">${UI.ESPECIE[s.especie] || ''}${s.microchip ? ' · Microchip ' + UI.esc(s.microchip) : ''}</span></div>${UI.badge(s.status)}</div>
          <dl class="dl"><dt>Tutor</dt><dd>${UI.esc(s.tutor_nome)}</dd><dt>Telefone</dt><dd>${s.tutor_telefone ? `<a href="tel:${U.digitos(s.tutor_telefone)}">${UI.esc(s.tutor_telefone)}</a>` : 'Não informado'}</dd>
            <dt>Atendimento</dt><dd>${UI.data(s.data)} às ${s.horario}</dd><dt>Solicitada em</dt><dd>${UI.dataHora(s.data_solicitacao)}</dd>
            <dt>CadÚnico</dt><dd>${s.cad_unico ? UI.esc(s.cad_unico) : 'Não informado'}</dd><dt>Observações</dt><dd>${s.observacoes ? UI.esc(s.observacoes) : '—'}</dd>${s.status === 'RECUSADO' && s.justificativa_recusa ? `<dt>Justificativa</dt><dd>${UI.esc(s.justificativa_recusa)}</dd>` : ''}</dl>
          ${s.status === 'PENDENTE' ? `<div class="card-actions"><button class="btn btn-primary btn-sm" type="button" data-ap="${s.id}"><i data-icon="check"></i>Aprovar</button><button class="btn btn-secondary btn-sm" type="button" data-re="${s.id}"><i data-icon="x"></i>Recusar</button></div>` : ''}</article>`).join('')}</div>`;
        const por = (id) => lista.find((x) => x.id === Number(id));
        alvo.querySelectorAll('[data-ap]').forEach((b) => b.onclick = () => aprovar(por(b.dataset.ap)));
        alvo.querySelectorAll('[data-re]').forEach((b) => b.onclick = () => recusar(por(b.dataset.re)));
        U.icones();
    }
    async function carregar() {
        c.innerHTML = UI.skeleton(3);
        const r = await Api.get('/solicitacoes');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        lista = r.data;
        const n = (st) => lista.filter((x) => x.status === st).length;
        c.innerHTML = `<div class="toolbar"><div class="chips" role="group" aria-label="Filtrar por situação">${['PENDENTE', 'APROVADO', 'RECUSADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'TODAS'].map((st) => `<button class="chip" type="button" data-f="${st}" aria-pressed="${st === filtro}">${st === 'TODAS' ? 'Todas' : UI.ROTULO[st]}<small>${st === 'TODAS' ? lista.length : n(st)}</small></button>`).join('')}</div></div><div id="lista"></div>`;
        c.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { filtro = b.dataset.f; c.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); cartoes(); });
        cartoes();
    }
    carregar();
})();
