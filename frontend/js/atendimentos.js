(async function () {
    const ctx = UI.iniciar({ perfis: ['CLINICA'], pagina: 'atendimentos.html', titulo: 'Atendimentos', sub: 'Registre o check-in, o microchip e a conclusão de cada procedimento.' });
    if (!ctx) return;
    const c = ctx.conteudo; let lista = [], filtro = null;
    const FILTROS = { HOJE: 'Hoje', ATIVOS: 'Em aberto', CONCLUIDOS: 'Concluídos', TODOS: 'Todos' };
    const passa = (x, f) => f === 'HOJE' ? x.data === UI.hoje() : f === 'ATIVOS' ? ['APROVADO', 'CHECKIN'].includes(x.status) : f === 'CONCLUIDOS' ? x.status === 'CONCLUIDO' : true;

    async function checkin(s) {
        if (!(await UI.confirmar({ titulo: 'Registrar check-in', texto: `Confirmar a chegada de ${s.animal_nome} (tutor: ${s.tutor_nome}) à clínica?`, rotulo: 'Registrar check-in' }))) return;
        UI.executar(await Api.put('/solicitacoes/' + s.id + '/status', { status: 'CHECKIN' }), carregar);
    }
    function concluir(s) {
        UI.modal({
            titulo: 'Concluir atendimento', rotulo: 'Concluir atendimento',
            corpo: `<p style="margin-top:0">Informe o microchip aplicado em <strong>${UI.esc(s.animal_nome)}</strong>. Ao concluir, o animal passa a constar como castrado e microchipado.</p>` + UI.campo('chip', 'Número do microchip', '<input class="input" id="chip" inputmode="numeric" autocomplete="off" maxlength="15" placeholder="15 dígitos">', { req: true, hint: '<span id="cn">0</span>/15 dígitos' }),
            aoEnviar: async (form) => {
                const i = form.querySelector('#chip'), v = U.digitos(i.value);
                U.erroCampo(i, v.length === 15 ? '' : 'O microchip deve ter exatamente 15 dígitos.');
                if (v.length !== 15) return false;
                const r = await Api.put('/solicitacoes/' + s.id + '/status', { status: 'CONCLUIDO', microchip: v });
                if (!r.ok) return { erro: r.message };
                UI.executar(r, carregar);
            }
        });
        const i = document.getElementById('chip');
        i.addEventListener('input', () => { i.value = U.digitos(i.value).slice(0, 15); document.getElementById('cn').textContent = i.value.length; });
    }
    function cartoes() {
        const v = lista.filter((x) => passa(x, filtro)), alvo = document.getElementById('lista');
        if (!v.length) { alvo.innerHTML = UI.vazio('stethoscope', 'Nenhum atendimento neste filtro', 'Solicitações aprovadas pela prefeitura aparecem aqui.'); U.icones(); return; }
        alvo.innerHTML = `<div class="cards">${v.map((s) => `<article class="card">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><h3>${UI.esc(s.animal_nome)}</h3><span class="muted" style="font-size:.875rem">${UI.ESPECIE[s.especie] || ''}</span></div>${UI.badge(s.status)}</div>
          <dl class="dl"><dt>Data</dt><dd>${UI.data(s.data)} às ${s.horario}</dd><dt>Tutor</dt><dd>${UI.esc(s.tutor_nome)}</dd><dt>Telefone</dt><dd>${s.tutor_telefone ? `<a href="tel:${U.digitos(s.tutor_telefone)}">${UI.esc(s.tutor_telefone)}</a>` : 'Não informado'}</dd>
            <dt>Microchip</dt><dd>${s.microchip ? UI.esc(s.microchip) : 'Não registrado'}</dd><dt>Observações</dt><dd>${s.observacoes ? UI.esc(s.observacoes) : '—'}</dd></dl>
          ${s.data !== UI.hoje() && s.status !== 'CONCLUIDO' ? `<p class="hint" style="margin:0">Agendado para ${UI.data(s.data)}.</p>` : ''}
          ${s.status === 'APROVADO' ? `<div class="card-actions"><button class="btn btn-primary btn-sm" type="button" data-ci="${s.id}"><i data-icon="log-in"></i>Registrar check-in</button></div>` : ''}
          ${s.status === 'CHECKIN' ? `<div class="card-actions"><button class="btn btn-primary btn-sm" type="button" data-co="${s.id}"><i data-icon="check"></i>Concluir e registrar microchip</button></div>` : ''}</article>`).join('')}</div>`;
        const por = (id) => lista.find((x) => x.id === Number(id));
        alvo.querySelectorAll('[data-ci]').forEach((b) => b.onclick = () => checkin(por(b.dataset.ci)));
        alvo.querySelectorAll('[data-co]').forEach((b) => b.onclick = () => concluir(por(b.dataset.co)));
        U.icones();
    }
    async function carregar() {
        c.innerHTML = UI.skeleton(3);
        const r = await Api.get('/solicitacoes');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        lista = r.data;
        if (!filtro) filtro = lista.some((x) => passa(x, 'HOJE')) ? 'HOJE' : 'ATIVOS';
        c.innerHTML = `<div class="toolbar"><div class="chips" role="group" aria-label="Filtrar atendimentos">${Object.entries(FILTROS).map(([k, t]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === filtro}">${t}<small>${lista.filter((x) => passa(x, k)).length}</small></button>`).join('')}</div></div><div id="lista"></div>`;
        c.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { filtro = b.dataset.f; c.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); cartoes(); });
        cartoes();
    }
    carregar();
})();
