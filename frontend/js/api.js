/* Sessão e comunicação com a API (único ponto de fetch das páginas novas). */
(function () {
    const cfg = window.CASTRAPET || {};
    // Servido pelo Express: URL relativa. Via Live Server (5500), aponta para a API local.
    const BASE = cfg.apiBase || (['5500', '5501'].includes(location.port) ? 'http://localhost:3000' : '');
    const HOME = { ADMIN: 'admin.html', CLINICA: 'clinica.html', TUTOR: 'tutor.html' };
    const K = { token: 'token', usuario: 'usuario' }; // mesmas chaves do código anterior

    const Sessao = {
        token: () => localStorage.getItem(K.token),
        usuario() { try { return JSON.parse(localStorage.getItem(K.usuario)); } catch (e) { return null; } },
        salvar(token, usuario) { localStorage.setItem(K.token, token); localStorage.setItem(K.usuario, JSON.stringify(usuario)); },
        limpar() { localStorage.removeItem(K.token); localStorage.removeItem(K.usuario); },
        home: (perfil) => HOME[perfil] || 'login.html',
        sair(motivo) { Sessao.limpar(); location.replace('login.html' + (motivo ? '?sessao=' + motivo : '')); },
        /** Protege páginas autenticadas; o backend continua sendo a autoridade final. */
        exigir(...perfis) {
            const u = Sessao.usuario();
            if (!Sessao.token() || !u) { Sessao.sair(); return null; }
            if (perfis.length && !perfis.includes(u.perfil)) { location.replace(Sessao.home(u.perfil)); return null; }
            return u;
        }
    };

    // A API responde erros ora em "mensagem", ora em "message".
    async function requisitar(caminho, { method = 'GET', body, auth = true } = {}) {
        const headers = {};
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        const token = Sessao.token();
        if (auth && token) headers.Authorization = 'Bearer ' + token;
        let resposta;
        try {
            resposta = await fetch(BASE + caminho, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
        } catch (e) {
            return { ok: false, status: 0, data: null, message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.' };
        }
        let data = null;
        try { data = await resposta.json(); } catch (e) { /* sem corpo JSON */ }
        if (resposta.status === 401 && auth && token) { Sessao.sair('expirada'); }
        const message = (data && (data.mensagem || data.message)) || (resposta.ok ? '' : 'Não foi possível concluir a operação.');
        return { ok: resposta.ok, status: resposta.status, data, message };
    }

    window.Sessao = Sessao;
    window.Api = {
        get: (c, o) => requisitar(c, { ...o }),
        post: (c, body, o) => requisitar(c, { ...o, method: 'POST', body }),
        put: (c, body, o) => requisitar(c, { ...o, method: 'PUT', body }),
        del: (c, o) => requisitar(c, { ...o, method: 'DELETE' })
    };
})();
