/* Casca dos painéis (sidebar por perfil, topbar) e componentes reutilizáveis. Global: UI */
(function () {
    const PRONTAS = new Set(['tutor.html','admin.html','clinica.html','animais.html','solicitar.html','solicitacoes.html','triagem.html','atendimentos.html','agenda.html','usuarios.html','animais-admin.html','perfil.html','guia.html']);
    const MENUS = {
        TUTOR: [['tutor.html', 'Visão geral', 'layout-dashboard'], ['animais.html', 'Meus animais', 'paw-print'], ['solicitar.html', 'Solicitar castração', 'calendar-plus'], ['solicitacoes.html', 'Minhas solicitações', 'clipboard-list'], ['guia.html', 'Guia pré-operatória', 'file-text'], ['perfil.html', 'Meu perfil', 'user']],
        ADMIN: [['admin.html', 'Visão geral', 'layout-dashboard'], ['triagem.html', 'Triagem', 'list-checks'], ['usuarios.html', 'Usuários', 'users'], ['animais-admin.html', 'Animais', 'paw-print'], ['agenda.html', 'Agenda', 'calendar'], ['perfil.html', 'Meu perfil', 'user']],
        CLINICA: [['clinica.html', 'Visão geral', 'layout-dashboard'], ['agenda.html', 'Agenda', 'calendar'], ['atendimentos.html', 'Atendimentos', 'stethoscope'], ['perfil.html', 'Meu perfil', 'user']]
    };
    const ROTULO = { PENDENTE: 'Pendente', APROVADO: 'Aprovada', RECUSADO: 'Recusada', CHECKIN: 'Check-in realizado', CONCLUIDO: 'Concluída', CANCELADO: 'Cancelada' };
    const COR = { PENDENTE: '#D99A32', APROVADO: '#237A57', RECUSADO: '#C44747', CHECKIN: '#2F6F9F', CONCLUIDO: '#174C3C', CANCELADO: '#8A958E' };
    const PERFIL = { ADMIN: 'Gestão municipal', CLINICA: 'Clínica conveniada', TUTOR: 'Tutor' };
    const ESPECIE = { CAO: 'Cão', GATO: 'Gato' }, SEXO = { MACHO: 'Macho', FEMEA: 'Fêmea' }, PORTE = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' };

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const data = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '');
    const dataHora = (ts) => (ts ? data(ts) + ' ' + String(ts).slice(11, 16) : '');
    const hoje = () => new Date().toLocaleDateString('sv-SE');
    const pronta = (href) => PRONTAS.has(href);

    const badge = (s) => `<span class="badge badge-${esc(s)}">${esc(ROTULO[s] || s)}</span>`;
    const vazio = (icone, titulo, texto, acao) => `<div class="empty"><i data-icon="${icone}"></i><h3>${esc(titulo)}</h3><p>${esc(texto)}</p>${acao || ''}</div>`;
    const skeleton = (n = 3) => `<div class="skel-list" aria-busy="true" aria-label="Carregando">${'<div class="skel"></div>'.repeat(n)}</div>`;
    const atalho = (href, icone, texto, cls = 'btn btn-secondary') => (pronta(href) ? `<a class="${cls}" href="${href}"><i data-icon="${icone}"></i>${texto}</a>` : '');
    const opcoes = (mapa, sel, vazioTxt) => (vazioTxt !== undefined ? `<option value="">${esc(vazioTxt)}</option>` : '') + Object.entries(mapa).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');
    const campo = (id, rotulo, inner, { req, hint } = {}) => `<div class="field"><label for="${id}">${esc(rotulo)}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}<span class="err" id="e-${id}"></span></div>`;

    function tabela(cols, linhas) {
        return `<div class="table-wrap"><table class="table"><thead><tr>${cols.map((c) => `<th scope="col">${c.h}</th>`).join('')}</tr></thead><tbody>${linhas.map((r) => `<tr>${cols.map((c) => `<td data-label="${esc(c.h)}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }

    function falha(el, msg, retry) {
        el.innerHTML = `<div class="empty empty-error"><i data-icon="wifi-off"></i><h3>Não foi possível carregar</h3><p>${esc(msg)}</p><button class="btn btn-secondary" type="button" data-retry>Tentar novamente</button></div>`;
        el.querySelector('[data-retry]').onclick = retry; U.icones();
    }

    function modal({ titulo, corpo, rotulo = 'Salvar', perigo = false, aoEnviar }) {
        const d = document.createElement('dialog'); d.className = 'modal';
        d.innerHTML = `<form novalidate><header class="modal-h"><h2>${esc(titulo)}</h2><button type="button" class="icon-btn" data-fechar aria-label="Fechar"><i data-icon="x"></i></button></header><div class="modal-b"><div class="alert" data-alerta></div>${corpo}</div><footer class="modal-f"><button type="button" class="btn btn-secondary" data-fechar>Cancelar</button><button type="submit" class="btn ${perigo ? 'btn-danger' : 'btn-primary'}"><span>${esc(rotulo)}</span></button></footer></form>`;
        document.body.append(d); U.icones(); d.showModal();
        d.addEventListener('close', () => d.remove());
        d.querySelectorAll('[data-fechar]').forEach((b) => { b.onclick = () => d.close(); });
        const form = d.querySelector('form'), btn = form.querySelector('[type=submit]'), al = d.querySelector('[data-alerta]');
        let enviando = false;
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); if (enviando) return;
            U.alerta(al, ''); enviando = true; U.carregando(btn, true, 'Salvando...');
            let r; try { r = await aoEnviar(form, d); } catch (x) { r = { erro: 'Ocorreu um erro inesperado. Tente novamente.' }; }
            enviando = false; U.carregando(btn, false);
            if (r === false) return;
            if (r && r.erro) { U.alerta(al, r.erro); return; }
            d.close();
        });
        const primeiro = form.querySelector('input:not([disabled]),select,textarea'); if (primeiro) primeiro.focus();
        return d;
    }
    function confirmar({ titulo, texto, rotulo = 'Confirmar', perigo = false }) {
        return new Promise((res) => {
            let ok = false;
            const d = modal({ titulo, corpo: `<p style="margin:0">${esc(texto)}</p>`, rotulo, perigo, aoEnviar: async () => { ok = true; } });
            d.addEventListener('close', () => res(ok));
        });
    }
    /** Mostra o retorno da API em toast e executa aoOk se deu certo. */
    function executar(r, aoOk) {
        U.toast(r.message || (r.ok ? 'Pronto.' : 'Não foi possível concluir a operação.'), r.ok ? 'success' : 'error');
        if (r.ok && aoOk) aoOk();
        return r.ok;
    }

    function iniciar(o) {
        const u = Sessao.exigir(...(o.perfis || [])); if (!u) return null;
        const home = Sessao.home(u.perfil);
        const menu = (MENUS[u.perfil] || []).filter((m) => PRONTAS.has(m[0]));
        const migalhas = o.pagina === home ? `<span aria-current="page">${esc(o.crumb || o.titulo)}</span>` : `<a href="${home}">Início</a><i data-icon="chevron-right"></i><span aria-current="page">${esc(o.crumb || o.titulo)}</span>`;
        document.getElementById('app').innerHTML = `
<div class="app" id="shell">
 <a class="skip" href="#view">Ir para o conteúdo</a>
 <aside class="sidebar" id="sidebar" aria-label="Menu lateral">
  <div class="sb-brand"><a class="brand" href="${home}" aria-label="CastraPet, início"><span class="brand-mark"><i data-icon="paw-print"></i></span><span class="brand-text">CastraPet</span></a></div>
  <nav class="sb-nav" aria-label="Principal">${menu.map((m) => `<a class="sb-link" href="${m[0]}" title="${m[1]}"${m[0] === o.pagina ? ' aria-current="page"' : ''}><i data-icon="${m[2]}"></i><span class="sb-label">${m[1]}</span></a>`).join('')}</nav>
  <div class="sb-user"><div class="sb-id"><span class="avatar" aria-hidden="true">${esc(u.nome.trim().charAt(0).toUpperCase())}</span><div><strong>${esc(u.nome)}</strong><small>${PERFIL[u.perfil] || ''}</small></div></div>
   <button class="sb-link" type="button" id="sair" title="Sair"><i data-icon="log-out"></i><span class="sb-label">Sair</span></button></div>
 </aside>
 <div class="scrim" id="scrim"></div>
 <div class="app-main">
  <header class="topbar">
   <button class="icon-btn menu-only" id="menu-btn" type="button" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false"><i data-icon="menu"></i></button>
   <button class="icon-btn desk-only" id="recolher" type="button" aria-label="Recolher menu" aria-pressed="false"><i data-icon="menu"></i></button>
   <nav class="crumbs" aria-label="Você está em">${migalhas}</nav>
  </header>
  <main class="page" id="view" tabindex="-1">
   <div class="page-head"><div><h1>${esc(o.titulo)}</h1>${o.sub ? `<p class="muted">${esc(o.sub)}</p>` : ''}</div><div class="page-actions" id="acoes"></div></div>
   <div id="conteudo"></div>
  </main>
 </div>
</div>`;
        document.title = (o.crumb || o.titulo) + ' | CastraPet';
        const shell = document.getElementById('shell'), mb = document.getElementById('menu-btn'), rc = document.getElementById('recolher');
        const abrir = (v) => { shell.classList.toggle('menu-open', v); mb.setAttribute('aria-expanded', String(v)); };
        mb.onclick = () => abrir(!shell.classList.contains('menu-open'));
        document.getElementById('scrim').onclick = () => abrir(false);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrir(false); });
        const pref = (() => { try { return localStorage.getItem('castrapet.sb') === '1'; } catch (e) { return false; } })();
        shell.classList.toggle('collapsed', pref); rc.setAttribute('aria-pressed', String(pref));
        rc.onclick = () => { const v = !shell.classList.contains('collapsed'); shell.classList.toggle('collapsed', v); rc.setAttribute('aria-pressed', String(v)); try { localStorage.setItem('castrapet.sb', v ? '1' : '0'); } catch (e) { /* preferência opcional */ } };
        document.getElementById('sair').onclick = () => Sessao.sair();
        U.icones();
        return { usuario: u, conteudo: document.getElementById('conteudo'), acoes: document.getElementById('acoes') };
    }

    window.UI = { esc, data, dataHora, hoje, pronta, badge, vazio, skeleton, atalho, opcoes, campo, tabela, falha, modal, confirmar, executar, iniciar, ROTULO, COR, PERFIL, ESPECIE, SEXO, PORTE };
})();
