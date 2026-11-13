(async function () {
    const ctx = UI.iniciar({ perfis: ['CLINICA'], pagina: 'clinica.html', titulo: 'Painel da clínica', crumb: 'Visão geral', sub: 'Atendimentos autorizados pela prefeitura.' });
    if (!ctx) return;
    const c = ctx.conteudo;
    ctx.acoes.innerHTML = UI.atalho('atendimentos.html', 'stethoscope', 'Atendimentos', 'btn btn-primary') + UI.atalho('agenda.html', 'calendar', 'Agenda');
    U.icones();
    const tab = (lista, vazio) => lista.length
        ? UI.tabela([{ h: 'Horário', f: (r) => `<strong>${r.horario}</strong><small>${UI.data(r.data)}</small>` }, { h: 'Animal', f: (r) => `${UI.esc(r.animal_nome)}<small>${UI.ESPECIE[r.especie] || ''}</small>` }, { h: 'Tutor', f: (r) => UI.esc(r.tutor_nome) }, { h: 'Situação', f: (r) => UI.badge(r.status) }], lista)
        : UI.vazio('calendar-check', vazio[0], vazio[1]);

    async function carregar() {
        c.innerHTML = UI.skeleton(4);
        const s = await Api.get('/solicitacoes');
        if (!s.ok) return UI.falha(c, s.message, carregar);
        const h = UI.hoje(), sol = s.data, n = (st) => sol.filter((x) => x.status === st).length;
        const hoje = sol.filter((x) => x.data === h && x.status !== 'CONCLUIDO');
        const proximos = sol.filter((x) => x.data > h && x.status === 'APROVADO').slice(0, 8);
        c.innerHTML = `<div class="stack">
          <div class="kpis">
            <div class="kpi"><b>${sol.filter((x) => x.data === h).length}</b><span>Atendimentos de hoje</span></div>
            <div class="kpi"><b>${n('APROVADO')}</b><span>Aguardando atendimento</span></div>
            <div class="kpi"><b>${n('CHECKIN')}</b><span>Com check-in realizado</span></div>
            <div class="kpi"><b>${n('CONCLUIDO')}</b><span>Procedimentos concluídos</span></div>
          </div>
          <section class="panel"><div class="panel-h"><h2>Atendimentos do dia</h2>${UI.atalho('atendimentos.html', 'arrow-right', 'Abrir atendimentos', 'btn btn-ghost btn-sm')}</div>${tab(hoje, ['Nada pendente para hoje', 'Os animais com atendimento marcado para hoje aparecem aqui.'])}</section>
          <section class="panel"><div class="panel-h"><h2>Próximos procedimentos</h2></div>${tab(proximos, ['Nenhum procedimento futuro', 'Solicitações aprovadas para os próximos dias aparecem aqui.'])}</section></div>`;
        U.icones();
    }
    carregar();
})();
