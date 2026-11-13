(async function () {
    const ctx = UI.iniciar({ perfis: ['ADMIN'], pagina: 'usuarios.html', titulo: 'Usuários', sub: 'Consulte as contas e ajuste o perfil de acesso.' });
    if (!ctx) return;
    const c = ctx.conteudo, eu = ctx.usuario; let lista = [];

    function alterar(u) {
        UI.modal({
            titulo: 'Alterar perfil de acesso', rotulo: 'Salvar perfil',
            corpo: `<p style="margin-top:0">Usuário: <strong>${UI.esc(u.nome)}</strong> (${UI.esc(u.email)})</p>` + UI.campo('perfil', 'Perfil', `<select class="input" id="perfil">${UI.opcoes(UI.PERFIL, u.perfil)}</select>`, { hint: 'O perfil define o que a pessoa pode acessar no sistema. Deve existir ao menos um administrador.' }),
            aoEnviar: async (form) => {
                const novo = form.querySelector('#perfil').value;
                if (novo === u.perfil) return { erro: 'Selecione um perfil diferente do atual.' };
                const r = await Api.put('/usuarios/' + u.id + '/perfil', { perfil: novo });
                if (!r.ok) return { erro: r.message };
                UI.executar(r, () => { if (u.id === eu.id) { U.toast('Seu perfil mudou. Entre novamente.'); setTimeout(() => Sessao.sair(), 1500); } else carregar(); });
            }
        });
    }
    function tabela() {
        const q = document.getElementById('busca').value.trim().toLowerCase(), p = document.getElementById('fp').value;
        const v = lista.filter((x) => (!p || x.perfil === p) && (!q || (x.nome + ' ' + x.email).toLowerCase().includes(q)));
        const alvo = document.getElementById('lista');
        if (!v.length) { alvo.innerHTML = UI.vazio('users', 'Nenhum usuário encontrado', 'Ajuste a busca ou o filtro.'); U.icones(); return; }
        alvo.innerHTML = UI.tabela([
            { h: 'Nome', f: (r) => `<strong>${UI.esc(r.nome)}</strong>${r.id === eu.id ? '<small>Você</small>' : ''}` }, { h: 'E-mail', f: (r) => UI.esc(r.email) },
            { h: 'CPF', f: (r) => (r.cpf ? U.mascaraCPF(r.cpf) : '—') }, { h: 'Telefone', f: (r) => (r.telefone ? UI.esc(r.telefone) : '—') },
            { h: 'Perfil', f: (r) => `<span class="badge badge-${r.perfil}">${UI.PERFIL[r.perfil]}</span>` }, { h: 'Cadastro', f: (r) => UI.data(r.criado_em) },
            { h: 'Ações', f: (r) => `<button class="btn btn-secondary btn-sm" type="button" data-p="${r.id}">Alterar perfil</button>` }], v);
        alvo.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => alterar(lista.find((x) => x.id === Number(b.dataset.p))));
    }
    async function carregar() {
        c.innerHTML = UI.skeleton(4);
        const r = await Api.get('/usuarios');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        lista = r.data;
        c.innerHTML = `<section class="panel"><div class="panel-b"><div class="toolbar" style="margin:0"><div class="grow"><label class="sr-only" for="busca">Buscar por nome ou e-mail</label><input class="input" id="busca" type="search" placeholder="Buscar por nome ou e-mail"></div><div><label class="sr-only" for="fp">Filtrar por perfil</label><select class="input" id="fp"><option value="">Todos os perfis</option>${UI.opcoes(UI.PERFIL)}</select></div></div></div><div id="lista"></div></section>`;
        document.getElementById('busca').oninput = tabela; document.getElementById('fp').onchange = tabela; tabela();
    }
    carregar();
})();
