(async function () {
    const ctx = UI.iniciar({ perfis: ['TUTOR'], pagina: 'animais.html', titulo: 'Meus animais', sub: 'Cadastre e mantenha atualizados os dados dos seus animais.' });
    if (!ctx) return;
    const c = ctx.conteudo; let lista = [];
    ctx.acoes.innerHTML = '<button class="btn btn-primary" type="button" id="novo"><i data-icon="plus"></i>Novo animal</button>';
    document.getElementById('novo').onclick = () => formulario();
    U.icones();

    const idade = (m) => { if (m == null) return 'Idade não informada'; if (m < 12) return m + (m === 1 ? ' mês' : ' meses'); const a = Math.floor(m / 12), r = m % 12; return a + (a === 1 ? ' ano' : ' anos') + (r ? ` e ${r} ${r === 1 ? 'mês' : 'meses'}` : ''); };

    function formulario(a) {
        const v = a || {};
        UI.modal({
            titulo: a ? 'Editar animal' : 'Novo animal', rotulo: a ? 'Salvar alterações' : 'Cadastrar animal',
            corpo: UI.campo('f-nome', 'Nome', `<input class="input" id="f-nome" maxlength="80" value="${UI.esc(v.nome)}" required>`, { req: true })
                + `<div class="grid-2">${UI.campo('f-especie', 'Espécie', `<select class="input" id="f-especie">${UI.opcoes(UI.ESPECIE, v.especie)}</select>`, { req: true })}${UI.campo('f-sexo', 'Sexo', `<select class="input" id="f-sexo">${UI.opcoes(UI.SEXO, v.sexo)}</select>`, { req: true })}</div>`
                + `<div class="grid-2">${UI.campo('f-raca', 'Raça', `<input class="input" id="f-raca" maxlength="60" value="${UI.esc(v.raca)}">`)}${UI.campo('f-porte', 'Porte', `<select class="input" id="f-porte">${UI.opcoes(UI.PORTE, v.porte, 'Não informado')}</select>`)}</div>`
                + UI.campo('f-idade', 'Idade (em meses)', `<input class="input" id="f-idade" type="number" min="0" max="300" step="1" inputmode="numeric" value="${v.idade_meses == null ? '' : v.idade_meses}">`, { hint: 'Entre 0 e 300 meses.' })
                + '<p class="hint" style="margin:0">O microchip e a situação de castração são registrados pela clínica e não podem ser alterados aqui.</p>',
            aoEnviar: async (form) => {
                const g = (id) => form.querySelector('#' + id);
                const nomeOk = g('f-nome').value.trim().length >= 1; U.erroCampo(g('f-nome'), nomeOk ? '' : 'Informe o nome do animal.');
                const idv = g('f-idade').value; const idN = idv === '' ? null : Number(idv);
                const idOk = idN === null || (Number.isInteger(idN) && idN >= 0 && idN <= 300); U.erroCampo(g('f-idade'), idOk ? '' : 'Informe um número inteiro de 0 a 300.');
                if (!nomeOk || !idOk) return false;
                const corpo = { nome: g('f-nome').value.trim(), especie: g('f-especie').value, sexo: g('f-sexo').value, raca: g('f-raca').value.trim(), porte: g('f-porte').value, idade_meses: idN };
                const r = a ? await Api.put('/animais/' + a.id, corpo) : await Api.post('/animais', corpo);
                if (!r.ok) return { erro: r.message };
                UI.executar(r, carregar);
            }
        });
    }

    async function excluir(a) {
        if (!(await UI.confirmar({ titulo: 'Excluir animal', texto: `Excluir ${a.nome}? Esta ação não pode ser desfeita.`, rotulo: 'Excluir', perigo: true }))) return;
        UI.executar(await Api.del('/animais/' + a.id), carregar);
    }

    async function carregar() {
        c.innerHTML = UI.skeleton(3);
        const r = await Api.get('/animais');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        lista = r.data;
        if (!lista.length) { c.innerHTML = UI.vazio('paw-print', 'Nenhum animal cadastrado', 'Cadastre seu cão ou gato para poder solicitar a castração.', '<button class="btn btn-primary" type="button" id="v-novo"><i data-icon="plus"></i>Cadastrar animal</button>'); document.getElementById('v-novo').onclick = () => formulario(); U.icones(); return; }
        c.innerHTML = `<div class="cards">${lista.map((a) => `<article class="card">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><h3>${UI.esc(a.nome)}</h3><span class="badge ${a.castrado ? 'badge-CONCLUIDO' : 'badge-neutro'}">${a.castrado ? 'Castrado' : 'Não castrado'}</span></div>
          <div class="meta"><span>${UI.ESPECIE[a.especie]} · ${UI.SEXO[a.sexo]}</span>${a.raca ? `<span>${UI.esc(a.raca)}</span>` : ''}${a.porte ? `<span>Porte ${UI.PORTE[a.porte].toLowerCase()}</span>` : ''}<span>${idade(a.idade_meses)}</span></div>
          <p class="meta" style="margin:0"><span><i data-icon="badge-check"></i>${a.microchip ? 'Microchip ' + UI.esc(a.microchip) : 'Microchip não registrado'}</span></p>
          <div class="card-actions"><button class="btn btn-secondary btn-sm" type="button" data-e="${a.id}"><i data-icon="pencil"></i>Editar</button><button class="btn btn-ghost btn-sm" type="button" data-x="${a.id}"><i data-icon="trash-2"></i>Excluir</button></div></article>`).join('')}</div>`;
        const por = (id) => lista.find((x) => x.id === Number(id));
        c.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => formulario(por(b.dataset.e)));
        c.querySelectorAll('[data-x]').forEach((b) => b.onclick = () => excluir(por(b.dataset.x)));
        U.icones();
    }
    carregar();
})();
