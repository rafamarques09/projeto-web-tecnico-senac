(async function () {
    const ctx = UI.iniciar({ perfis: ['ADMIN'], pagina: 'animais-admin.html', titulo: 'Animais cadastrados', sub: 'Consulta geral dos animais, tutores e identificação.' });
    if (!ctx) return;
    const c = ctx.conteudo, POR = 10; let lista = [], pag = 1;

    function tabela() {
        const q = document.getElementById('busca').value.trim().toLowerCase(), e = document.getElementById('fe').value, k = document.getElementById('fc').value;
        const v = lista.filter((x) => (!e || x.especie === e) && (!k || (k === 'SIM') === !!x.castrado) && (!q || (x.nome + ' ' + x.tutor_nome + ' ' + (x.microchip || '')).toLowerCase().includes(q)));
        const total = Math.max(1, Math.ceil(v.length / POR)); if (pag > total) pag = total;
        const alvo = document.getElementById('lista');
        if (!v.length) { alvo.innerHTML = UI.vazio('search', 'Nenhum animal encontrado', 'Ajuste a busca ou os filtros.'); U.icones(); return; }
        alvo.innerHTML = UI.tabela([
            { h: 'Nome', f: (r) => `<strong>${UI.esc(r.nome)}</strong>` }, { h: 'Espécie', f: (r) => UI.ESPECIE[r.especie] }, { h: 'Sexo', f: (r) => UI.SEXO[r.sexo] }, { h: 'Tutor', f: (r) => UI.esc(r.tutor_nome) },
            { h: 'Castração', f: (r) => `<span class="badge ${r.castrado ? 'badge-CONCLUIDO' : 'badge-neutro'}">${r.castrado ? 'Castrado' : 'Não castrado'}</span>` }, { h: 'Microchip', f: (r) => (r.microchip ? UI.esc(r.microchip) : '—') }
        ], v.slice((pag - 1) * POR, pag * POR))
            + `<div class="pager"><span>${v.length} animal(is) · página ${pag} de ${total}</span><div class="row-actions"><button class="btn btn-secondary btn-sm" type="button" id="ant"${pag <= 1 ? ' disabled' : ''}>Anterior</button><button class="btn btn-secondary btn-sm" type="button" id="prox"${pag >= total ? ' disabled' : ''}>Próxima</button></div></div>`;
        document.getElementById('ant').onclick = () => { pag--; tabela(); }; document.getElementById('prox').onclick = () => { pag++; tabela(); };
    }
    async function carregar() {
        c.innerHTML = UI.skeleton(4);
        const r = await Api.get('/animais');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        lista = r.data;
        c.innerHTML = `<section class="panel"><div class="panel-b"><div class="toolbar" style="margin:0"><div class="grow"><label class="sr-only" for="busca">Buscar</label><input class="input" id="busca" type="search" placeholder="Buscar por animal, tutor ou microchip"></div>
          <div><label class="sr-only" for="fe">Espécie</label><select class="input" id="fe"><option value="">Todas as espécies</option>${UI.opcoes(UI.ESPECIE)}</select></div>
          <div><label class="sr-only" for="fc">Castração</label><select class="input" id="fc"><option value="">Todas as situações</option><option value="SIM">Castrados</option><option value="NAO">Não castrados</option></select></div></div></div><div id="lista"></div></section>`;
        ['busca', 'fe', 'fc'].forEach((id) => document.getElementById(id).addEventListener(id === 'busca' ? 'input' : 'change', () => { pag = 1; tabela(); }));
        tabela();
    }
    carregar();
})();
