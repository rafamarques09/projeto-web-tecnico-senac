(async function () {
    const ctx = UI.iniciar({ perfis: ['TUTOR'], pagina: 'solicitar.html', titulo: 'Solicitar castração', sub: 'Escolha o animal, o dia e o horário do atendimento.' });
    if (!ctx) return;
    const c = ctx.conteudo;
    const PASSOS = ['Animal', 'Data e horário', 'Detalhes', 'Revisão'];
    const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const est = { passo: 1, animal: null, slot: null, dia: null, cad: '', obs: '', feito: null, erro: '' };
    let animais = [], abertas = new Set(), horarios = [], enviando = false;

    async function dados() {
        const [a, s, g] = await Promise.all([Api.get('/animais'), Api.get('/solicitacoes'), Api.get('/agenda')]);
        const falha = [a, s, g].find((x) => !x.ok); if (falha) return falha;
        animais = a.data;
        abertas = new Set(s.data.filter((x) => ['PENDENTE', 'APROVADO', 'CHECKIN'].includes(x.status)).map((x) => x.animal_id));
        const h = UI.hoje();
        horarios = g.data.filter((x) => x.ativa && x.data >= h);
        if (est.animal) est.animal = animais.find((x) => x.id === est.animal.id && !x.castrado && !abertas.has(x.id)) || null;
        if (est.slot) est.slot = horarios.find((x) => x.id === est.slot.id && x.vagas_restantes > 0) || null;
        return null;
    }

    const cabecalho = () => `<ol class="wiz" aria-label="Etapas">${PASSOS.map((p, i) => `<li class="${i + 1 === est.passo ? 'on' : i + 1 < est.passo ? 'ok' : ''}"${i + 1 === est.passo ? ' aria-current="step"' : ''}><b>${i + 1}</b><span>${p}</span></li>`).join('')}</ol>`;
    const rodape = (podeAvancar, rotulo = 'Continuar') => `<div class="nav-row">${est.passo > 1 ? '<button class="btn btn-secondary" type="button" data-voltar><i data-icon="arrow-left"></i>Voltar</button>' : '<span></span>'}<button class="btn btn-primary" type="button" data-avancar ${podeAvancar ? '' : 'disabled'}><span>${rotulo}</span></button></div>`;
    const resumo = () => `<dl class="dl"><dt>Animal</dt><dd>${UI.esc(est.animal.nome)} (${UI.ESPECIE[est.animal.especie]})</dd><dt>Data</dt><dd>${UI.data(est.slot.data)}</dd><dt>Horário</dt><dd>${est.slot.horario}</dd><dt>CadÚnico</dt><dd>${est.cad.trim() ? UI.esc(est.cad.trim()) : 'Não informado'}</dd><dt>Observações</dt><dd>${est.obs.trim() ? UI.esc(est.obs.trim()) : '—'}</dd></dl>`;

    function passo1() {
        if (!animais.length) return UI.vazio('paw-print', 'Cadastre um animal primeiro', 'Para solicitar a castração é preciso ter o animal cadastrado.', UI.atalho('animais.html', 'plus', 'Cadastrar animal', 'btn btn-primary'));
        return `<h2 tabindex="-1">Qual animal será atendido?</h2><div class="stack">${animais.map((a) => {
            const bloq = a.castrado ? 'Já castrado' : abertas.has(a.id) ? 'Solicitação em andamento' : '';
            return `<button class="opt" type="button" data-a="${a.id}" aria-pressed="${!!est.animal && est.animal.id === a.id}"${bloq ? ' disabled' : ''}><span><strong>${UI.esc(a.nome)}</strong><small>${UI.ESPECIE[a.especie]} · ${UI.SEXO[a.sexo]}${bloq ? ' · ' + bloq : ''}</small></span></button>`;
        }).join('')}</div>${rodape(!!est.animal)}`;
    }
    function passo2() {
        const dias = [...new Set(horarios.map((h) => h.data))];
        if (!dias.length) return `<h2 tabindex="-1">Data e horário</h2>${UI.vazio('calendar-x', 'Nenhum horário disponível', 'No momento não há horários abertos. Volte mais tarde para consultar novamente.')}${rodape(false)}`;
        if (!est.dia || !dias.includes(est.dia)) est.dia = dias.find((d) => horarios.some((h) => h.data === d && h.vagas_restantes > 0)) || dias[0];
        return `<h2 tabindex="-1">Escolha a data</h2><div class="days" role="group" aria-label="Datas">${dias.map((d) => { const [y, m, dd] = d.split('-').map(Number); return `<button class="opt" type="button" data-d="${d}" aria-pressed="${d === est.dia}"><strong>${String(dd).padStart(2, '0')}</strong><small>${SEM[new Date(y, m - 1, dd).getDay()]} · ${MES[m - 1]}</small></button>`; }).join('')}</div>
          <h2>Escolha o horário</h2><div class="slots" role="group" aria-label="Horários">${horarios.filter((h) => h.data === est.dia).map((h) => `<button class="opt" type="button" data-s="${h.id}" aria-pressed="${!!est.slot && est.slot.id === h.id}"${h.vagas_restantes <= 0 ? ' disabled' : ''}><strong>${h.horario}</strong><small>${h.vagas_restantes > 0 ? h.vagas_restantes + (h.vagas_restantes === 1 ? ' vaga' : ' vagas') : 'Esgotado'}</small></button>`).join('')}</div>${rodape(!!est.slot)}`;
    }
    const passo3 = () => `<h2 tabindex="-1">Informações adicionais</h2>${UI.campo('cad', 'Número do CadÚnico', `<input class="input" id="cad" maxlength="20" inputmode="numeric" value="${UI.esc(est.cad)}">`, { hint: 'Informe se você for inscrito no CadÚnico. Opcional.' })}${UI.campo('obs', 'Observações', `<textarea class="input" id="obs" maxlength="500">${UI.esc(est.obs)}</textarea>`, { hint: '<span id="cont">' + est.obs.length + '</span>/500 caracteres. Informe condições de saúde ou outras observações relevantes.' })}${rodape(true)}`;
    const passo4 = () => `<h2 tabindex="-1">Revise e confirme</h2><div class="alert" id="alerta"></div><div class="panel"><div class="panel-b">${resumo()}</div></div><p class="hint" style="margin:var(--s3) 0 0">Após o envio, a solicitação segue para análise da prefeitura. A disponibilidade final é confirmada no momento do envio.</p>${rodape(true, 'Confirmar solicitação')}`;
    const sucesso = () => `<div class="empty"><i data-icon="circle-check"></i><h2>Solicitação enviada</h2><p>${UI.esc(est.feito)}</p><div class="panel" style="width:100%;max-width:420px;text-align:left"><div class="panel-b">${resumo()}</div></div><div class="cta-row">${UI.atalho('solicitacoes.html', 'clipboard-list', 'Acompanhar solicitação', 'btn btn-primary')}${UI.atalho('tutor.html', 'layout-dashboard', 'Voltar à visão geral')}</div></div>`;

    function render(foco) {
        if (est.feito) { c.innerHTML = sucesso(); U.icones(); return; }
        c.innerHTML = `<div class="panel"><div class="panel-b">${cabecalho()}${[passo1, passo2, passo3, passo4][est.passo - 1]()}</div></div>`;
        c.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { est.animal = animais.find((x) => x.id === Number(b.dataset.a)); render(); });
        c.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { est.dia = b.dataset.d; if (est.slot && est.slot.data !== est.dia) est.slot = null; render(); });
        c.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { est.slot = horarios.find((x) => x.id === Number(b.dataset.s)); render(); });
        const cad = c.querySelector('#cad'), obs = c.querySelector('#obs');
        if (cad) cad.oninput = () => { est.cad = cad.value; };
        if (obs) obs.oninput = () => { est.obs = obs.value; c.querySelector('#cont').textContent = obs.value.length; };
        const v = c.querySelector('[data-voltar]'); if (v) v.onclick = () => { est.passo--; render(true); };
        const av = c.querySelector('[data-avancar]');
        if (av) av.onclick = () => { if (est.passo < 4) { est.passo++; render(true); } else enviar(av); };
        U.icones();
        if (foco) { const h = c.querySelector('h2'); if (h) h.focus(); }
    }

    async function enviar(btn) {
        if (enviando) return; enviando = true; U.carregando(btn, true, 'Enviando...');
        const r = await Api.post('/solicitacoes', { animal_id: est.animal.id, agenda_id: est.slot.id, cad_unico: est.cad.trim(), observacoes: est.obs.trim() });
        enviando = false;
        if (r.ok) { est.feito = r.message || 'Solicitação enviada.'; render(); c.scrollIntoView({ block: 'start' }); return; }
        U.carregando(btn, false);
        U.alerta(document.getElementById('alerta'), r.message);
        const f = await dados(); // atualiza vagas e animais com o estado real do servidor
        if (!f && (!est.slot || !est.animal)) { est.passo = !est.animal ? 1 : 2; render(true); U.toast(r.message, 'error'); }
    }

    async function iniciar() {
        c.innerHTML = UI.skeleton(3);
        const f = await dados();
        if (f) return UI.falha(c, f.message, iniciar);
        render();
    }
    iniciar();
})();
