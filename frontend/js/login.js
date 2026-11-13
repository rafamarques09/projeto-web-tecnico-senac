(function () {
    const u = Sessao.usuario();
    if (Sessao.token() && u) { location.replace(Sessao.home(u.perfil)); return; }

    const form = document.getElementById('form-login');
    const aviso = document.getElementById('aviso');
    const btn = document.getElementById('entrar');
    const email = document.getElementById('email');
    const senha = document.getElementById('senha');
    let enviando = false;

    const q = new URLSearchParams(location.search);
    if (q.get('sessao') === 'expirada') U.alerta(aviso, 'Sua sessão expirou. Entre novamente para continuar.', 'warn');
    if (q.get('cadastro') === 'ok') U.alerta(aviso, 'Conta criada com sucesso. Entre com seu e-mail e senha.', 'success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (enviando) return;
        U.alerta(aviso, '');
        const v = email.value.trim();
        const erroEmail = !v ? 'Informe seu e-mail.' : (!U.emailValido(v) ? 'Informe um e-mail válido.' : '');
        const erroSenha = !senha.value ? 'Informe sua senha.' : (!U.senhaValida(senha.value) ? 'A senha deve ter entre 8 e 72 caracteres.' : '');
        U.erroCampo(email, erroEmail); U.erroCampo(senha, erroSenha);
        if (erroEmail || erroSenha) { (erroEmail ? email : senha).focus(); return; }

        enviando = true; U.carregando(btn, true, 'Entrando...');
        const r = await Api.post('/auth/login', { email: v, senha: senha.value }, { auth: false });
        if (!r.ok) {
            enviando = false; U.carregando(btn, false);
            U.alerta(aviso, r.message || 'Não foi possível entrar.');
            return;
        }
        Sessao.salvar(r.data.token, r.data.usuario);
        location.replace(Sessao.home(r.data.usuario.perfil));
    });
})();
