(async function () {
    const nome = (Sessao.usuario() || {}).nome || '';
    const ctx = UI.iniciar({ perfis: ['TUTOR'], pagina: 'tutor.html', titulo: 'Olá, ' + nome.trim().split(' ')[0], crumb: 'Visão geral', sub: 'Acompanhe seus animais e solicitações de castração.' });
    if (!ctx) return;
    const c = ctx.conteudo;
    ctx.acoes.innerHTML = UI.atalho('solicitar.html', 'plus', 'Solicitar castração', 'btn btn-primary');
    U.icones();

    async function carregar() {
        c.innerHTML = UI.skeleton(4);
        const [a, s] = await Promise.all([Api.get('/animais'), Api.get('/solicitacoes')]);
        if (!a.ok || !s.ok) return UI.falha(c, (a.ok ? s : a).message, carregar);
        const animais = a.data, sol = s.data;
        const n = (st) => sol.filter((x) => x.status === st).length;
        const prox = sol.filter((x) => ['APROVADO', 'CHECKIN'].includes(x.status) && x.data >= UI.hoje())
            .sort((x, y) => (x.data + x.horario).localeCompare(y.data + y.horario))[0];
        const recentes = [...sol].sort((x, y) => y.id - x.id).slice(0, 5);

        const proximo = prox
            ? `<dl class="dl"><dt>Animal</dt><dd>${UI.esc(prox.animal_nome)}</dd><dt>Data</dt><dd>${UI.data(prox.data)} às ${prox.horario}</dd><dt>Situação</dt><dd>${UI.badge(prox.status)}</dd></dl>
               <div class="card-actions">${UI.atalho('guia.html', 'file-text', 'Ver guia pré-operatória')}</div>`
            : UI.vazio('calendar-check', 'Nenhum atendimento agendado', 'Quando uma solicitação for aprovada, a data e o horário aparecem aqui.', UI.atalho('solicitar.html', 'plus', 'Solicitar castração', 'btn btn-primary btn-sm'));
        const hist = recentes.length
            ? UI.tabela([{ h: 'Animal', f: (r) => `${UI.esc(r.animal_nome)}<small>${UI.ESPECIE[r.especie] || ''}</small>` }, { h: 'Atendimento', f: (r) => `${UI.data(r.data)} · ${r.horario}` }, { h: 'Situação', f: (r) => UI.badge(r.status) }], recentes)
            : UI.vazio('clipboard-list', 'Nenhuma solicitação ainda', 'Cadastre um animal e solicite a castração para acompanhar aqui.');

        c.innerHTML = `<div class="stack">
          <div class="kpis">
            <div class="kpi"><b>${animais.length}</b><span>Animais cadastrados</span></div>
            <div class="kpi"><b>${n('PENDENTE')}</b><span>Solicitações pendentes</span></div>
            <div class="kpi"><b>${n('APROVADO') + n('CHECKIN')}</b><span>Agendamentos aprovados</span></div>
            <div class="kpi"><b>${n('CONCLUIDO')}</b><span>Procedimentos concluídos</span></div>
          </div>
          <div class="cols">
            <div class="stack">
              <section class="panel"><div class="panel-h"><h2>Próximo atendimento</h2></div><div class="panel-b">${proximo}</div></section>
              <section class="panel"><div class="panel-h"><h2>Histórico recente</h2>${UI.atalho('solicitacoes.html', 'arrow-right', 'Ver todas', 'btn btn-ghost btn-sm')}</div>${hist}</section>
            </div>
            <div class="stack">
              <section class="panel"><div class="panel-h"><h2>Acesso rápido</h2></div><div class="panel-b stack">
                ${UI.atalho('animais.html', 'paw-print', 'Meus animais')}${UI.atalho('solicitar.html', 'calendar-plus', 'Solicitar castração')}${UI.atalho('solicitacoes.html', 'clipboard-list', 'Minhas solicitações')}${UI.atalho('guia.html', 'file-text', 'Guia pré-operatória')}</div></section>
              <section class="panel"><div class="panel-h"><h2>Orientações importantes</h2></div><div class="panel-b"><ul class="guia" style="margin:0"><li>Compareça no dia e horário aprovados.</li><li>Confirme com a clínica o jejum e o preparo do animal.</li><li>Se não puder ir, cancele a solicitação para liberar a vaga.</li></ul></div></section>
            </div>
          </div></div>`;
        U.icones();
    }
    carregar();
})();
