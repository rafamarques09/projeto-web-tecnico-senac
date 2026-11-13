(async function () {
    const ctx = UI.iniciar({ perfis: ['ADMIN', 'CLINICA'], pagina: 'agenda.html', titulo: 'Agenda de atendimento', sub: 'Gerencie horários, vagas e disponibilidade.' });
    if (!ctx) return;
    const c = ctx.conteudo; let todos = [], mes = UI.hoje().slice(0, 7), dia = null, sit = 'TODOS';
    ctx.acoes.innerHTML = '<button class="btn btn-primary" type="button" id="novo"><i data-icon="plus"></i>Novo horário</button>';
    document.getElementById('novo').onclick = () => formulario();
    U.icones();
    const ocup = (h) => h.vagas - h.vagas_restantes;
    const corpo = (h, extra) => ({ data: h.data, horario: h.horario, vagas: h.vagas, ativa: !!h.ativa, ...extra });

    function formulario(h) {
        const oc = h ? ocup(h) : 0, trava = oc > 0;
        UI.modal({
            titulo: h ? 'Editar horário' : 'Novo horário', rotulo: h ? 'Salvar alterações' : 'Criar horário',
            corpo: `<div class="grid-2">${UI.campo('f-data', 'Data', `<input class="input" id="f-data" type="date" min="${UI.hoje()}" value="${h ? h.data : dia || ''}"${trava ? ' disabled' : ''}>`, { req: true })}${UI.campo('f-hora', 'Horário', `<input class="input" id="f-hora" type="time" value="${h ? h.horario : ''}"${trava ? ' disabled' : ''}>`, { req: true })}</div>`
                + (trava ? `<p class="hint" style="margin-top:0">Este horário já tem ${oc} solicitação(ões): data e hora não podem ser alteradas.</p>` : '')
                + UI.campo('f-vagas', 'Vagas', `<input class="input" id="f-vagas" type="number" min="${Math.max(1, oc)}" max="100" step="1" inputmode="numeric" value="${h ? h.vagas : ''}">`, { req: true, hint: oc ? `Mínimo de ${oc}, igual às vagas já ocupadas.` : 'Entre 1 e 100.' })
                + `<label class="check"><input type="checkbox" id="f-ativa"${!h || h.ativa ? ' checked' : ''}>Horário aberto para solicitações</label>`,
            aoEnviar: async (form) => {
                const g = (id) => form.querySelector('#' + id);
                const d = trava ? h.data : g('f-data').value, t = trava ? h.horario : g('f-hora').value, v = Number(g('f-vagas').value);
                const eD = !d ? 'Informe a data.' : (!h && d < UI.hoje()) ? 'A data não pode estar no passado.' : '';
                const eT = t ? '' : 'Informe o horário.';
                const eV = (!Number.isInteger(v) || v < Math.max(1, oc) || v > 100) ? `Informe de ${Math.max(1, oc)} a 100 vagas.` : '';
                if (!trava) { U.erroCampo(g('f-data'), eD); U.erroCampo(g('f-hora'), eT); } U.erroCampo(g('f-vagas'), eV);
                if ((!trava && (eD || eT)) || eV) return false;
                const body = { data: d, horario: t, vagas: v, ativa: g('f-ativa').checked };
                const r = h ? await Api.put('/agenda/' + h.id, body) : await Api.post('/agenda', body);
                if (!r.ok) return { erro: r.message };
                if (!h) { mes = d.slice(0, 7); dia = d; }
                UI.executar(r, carregar);
            }
        });
    }
    async function alternar(h) {
        if (h.ativa && !(await UI.confirmar({ titulo: 'Fechar horário', texto: `Fechar ${UI.data(h.data)} às ${h.horario}? Novos tutores não poderão escolher este horário. Solicitações existentes são mantidas.`, rotulo: 'Fechar horário' }))) return;
        UI.executar(await Api.put('/agenda/' + h.id, corpo(h, { ativa: !h.ativa })), carregar);
    }
    async function excluir(h) {
        if (!(await UI.confirmar({ titulo: 'Excluir horário', texto: `Excluir ${UI.data(h.data)} às ${h.horario}? Horários com solicitações não podem ser excluídos; feche-os.`, rotulo: 'Excluir', perigo: true }))) return;
        UI.executar(await Api.del('/agenda/' + h.id), carregar);
    }

    function desenhar() {
        const [y, m] = mes.split('-').map(Number), ini = new Date(y, m - 1, 1).getDay(), nd = new Date(y, m, 0).getDate(), hj = UI.hoje();
        const porDia = {}; todos.forEach((x) => { (porDia[x.data] = porDia[x.data] || []).push(x); });
        let cel = '<span class="cal-d vazio"></span>'.repeat(ini);
        for (let d = 1; d <= nd; d++) {
            const iso = `${mes}-${String(d).padStart(2, '0')}`, hs = porDia[iso] || [];
            cel += `<button type="button" class="cal-d${iso < hj ? ' passado' : ''}${hs.length && !hs.some((x) => x.ativa) ? ' fechado' : ''}" data-dia="${iso}" aria-pressed="${dia === iso}" aria-label="${d}, ${hs.length} horário(s)">${d}${hs.length ? `<small>${hs.length}</small>` : ''}</button>`;
        }
        const nome = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const v = todos.filter((x) => (dia ? x.data === dia : x.data.startsWith(mes)) && (sit === 'TODOS' || (sit === 'ABERTOS') === !!x.ativa));
        const lista = v.length ? UI.tabela([
            { h: 'Horário', f: (r) => `<strong>${r.horario}</strong><small>${UI.data(r.data)}</small>` },
            { h: 'Vagas', f: (r) => `<strong>${r.vagas_restantes}</strong> restante${r.vagas_restantes === 1 ? '' : 's'}<small>${ocup(r)} de ${r.vagas} ocupada${ocup(r) === 1 ? '' : 's'}</small>` },
            { h: 'Situação', f: (r) => (r.ativa ? '<span class="badge badge-APROVADO">Aberto</span>' : '<span class="badge badge-neutro">Fechado</span>') },
            { h: 'Ações', f: (r) => `<div class="row-actions"><button class="btn btn-secondary btn-sm" type="button" data-e="${r.id}"><i data-icon="pencil"></i>Editar</button><button class="btn btn-ghost btn-sm" type="button" data-t="${r.id}">${r.ativa ? 'Fechar' : 'Reabrir'}</button><button class="btn btn-ghost btn-sm" type="button" data-x="${r.id}" aria-label="Excluir horário" title="Excluir horário"><i data-icon="trash-2"></i></button></div>` }], v)
            : UI.vazio('calendar', 'Nenhum horário neste período', 'Crie um horário para disponibilizar vagas aos tutores.', '<button class="btn btn-primary btn-sm" type="button" id="v-novo"><i data-icon="plus"></i>Novo horário</button>');
        c.innerHTML = `<div class="cols cols-r">
          <section class="panel"><div class="panel-b">
            <div class="cal-h"><button class="icon-btn" type="button" data-m="-1" aria-label="Mês anterior"><i data-icon="chevron-left"></i></button><strong>${nome.charAt(0).toUpperCase() + nome.slice(1)}</strong><button class="icon-btn" type="button" data-m="1" aria-label="Próximo mês"><i data-icon="chevron-right"></i></button></div>
            <div class="cal" role="group" aria-label="Calendário">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w) => `<span class="cal-w" aria-hidden="true">${w}</span>`).join('')}${cel}</div>
            <div class="field" style="margin:var(--s4) 0 0"><label for="fd">Filtrar por data</label><input class="input" type="date" id="fd" value="${dia || ''}"></div>
            ${dia ? '<button class="btn btn-ghost btn-sm" type="button" id="limpar" style="margin-top:8px">Mostrar o mês inteiro</button>' : ''}</div></section>
          <section class="panel"><div class="panel-h"><h2>${dia ? 'Horários de ' + UI.data(dia) : 'Horários de ' + nome}</h2><div class="chips" role="group" aria-label="Situação">${[['TODOS', 'Todos'], ['ABERTOS', 'Abertos'], ['FECHADOS', 'Fechados']].map(([k, t]) => `<button class="chip" type="button" data-s="${k}" aria-pressed="${sit === k}">${t}</button>`).join('')}</div></div>${lista}</section></div>`;
        c.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { mes = new Date(y, m - 1 + Number(b.dataset.m), 1).toLocaleDateString('sv-SE').slice(0, 7); dia = null; desenhar(); });
        c.querySelectorAll('[data-dia]').forEach((b) => b.onclick = () => { dia = dia === b.dataset.dia ? null : b.dataset.dia; desenhar(); });
        c.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { sit = b.dataset.s; desenhar(); });
        document.getElementById('fd').onchange = (e) => { dia = e.target.value || null; if (dia) mes = dia.slice(0, 7); desenhar(); };
        const l = document.getElementById('limpar'); if (l) l.onclick = () => { dia = null; desenhar(); };
        const vn = document.getElementById('v-novo'); if (vn) vn.onclick = () => formulario();
        const por = (id) => todos.find((x) => x.id === Number(id));
        c.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => formulario(por(b.dataset.e)));
        c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => alternar(por(b.dataset.t)));
        c.querySelectorAll('[data-x]').forEach((b) => b.onclick = () => excluir(por(b.dataset.x)));
        U.icones();
    }
    async function carregar() {
        if (!todos.length) c.innerHTML = UI.skeleton(3);
        const r = await Api.get('/agenda');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        todos = r.data; desenhar();
    }
    carregar();
})();
