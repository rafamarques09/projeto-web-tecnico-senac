(async function () {
    const ctx = UI.iniciar({ perfis: ['ADMIN'], pagina: 'admin.html', titulo: 'Painel da gestão municipal', crumb: 'Visão geral', sub: 'Indicadores do programa de castração e identificação.' });
    if (!ctx) return;
    const c = ctx.conteudo; let filtro = 'TODAS', sol = [];
    ctx.acoes.innerHTML = UI.atalho('triagem.html', 'list-checks', 'Triagem', 'btn btn-primary') + UI.atalho('agenda.html', 'calendar', 'Agenda');
    U.icones();

    function recentes() {
        const lista = [...sol].sort((x, y) => y.id - x.id).filter((x) => filtro === 'TODAS' || x.status === filtro).slice(0, 8);
        document.getElementById('rec').innerHTML = lista.length
            ? UI.tabela([{ h: 'Animal', f: (r) => `${UI.esc(r.animal_nome)}<small>${UI.ESPECIE[r.especie] || ''}</small>` }, { h: 'Tutor', f: (r) => UI.esc(r.tutor_nome) }, { h: 'Atendimento', f: (r) => `${UI.data(r.data)} · ${r.horario}` }, { h: 'Situação', f: (r) => UI.badge(r.status) }], lista)
            : UI.vazio('inbox', 'Nenhuma solicitação neste filtro', 'Altere o filtro para ver outras situações.');
        U.icones();
    }

    async function carregar() {
        c.innerHTML = UI.skeleton(4);
        const [a, s] = await Promise.all([Api.get('/animais'), Api.get('/solicitacoes')]);
        if (!a.ok || !s.ok) return UI.falha(c, (a.ok ? s : a).message, carregar);
        const animais = a.data; sol = s.data;
        const n = (st) => sol.filter((x) => x.status === st).length;
        const barras = sol.length
            ? Object.keys(UI.ROTULO).map((st) => `<div class="bar-row"><span>${UI.ROTULO[st]}</span><div class="bar" role="img" aria-label="${n(st)} de ${sol.length}"><i style="width:${(n(st) / sol.length) * 100}%;background:${UI.COR[st]}"></i></div><strong>${n(st)}</strong></div>`).join('')
            : UI.vazio('bar-chart-3', 'Sem dados para o gráfico', 'A distribuição por situação aparece quando houver solicitações.');
        const chips = ['TODAS', ...Object.keys(UI.ROTULO)].map((st) => `<button class="chip" type="button" data-f="${st}" aria-pressed="${st === filtro}">${st === 'TODAS' ? 'Todas' : UI.ROTULO[st]}</button>`).join('');
        c.innerHTML = `<div class="stack">
          <div class="kpis">
            <div class="kpi"><b>${animais.length}</b><span>Animais cadastrados</span></div>
            <div class="kpi"><b>${sol.length}</b><span>Total de solicitações</span></div>
            <div class="kpi"><b>${n('PENDENTE')}</b><span>Pendentes de triagem</span></div>
            <div class="kpi"><b>${n('APROVADO')}</b><span>Aprovadas</span></div>
            <div class="kpi"><b>${n('CONCLUIDO')}</b><span>Procedimentos concluídos</span></div>
            <div class="kpi"><b>${animais.filter((x) => x.microchip).length}</b><span>Animais microchipados</span></div>
          </div>
          <div class="cols">
            <section class="panel"><div class="panel-h"><h2>Solicitações recentes</h2></div><div class="panel-b"><div class="chips" role="group" aria-label="Filtrar por situação">${chips}</div></div><div id="rec"></div></section>
            <section class="panel"><div class="panel-h"><h2>Solicitações por situação</h2></div><div class="panel-b">${barras}</div></section>
          </div></div>`;
        c.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { filtro = b.dataset.f; c.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); recentes(); });
        recentes();
    }
    carregar();
})();
