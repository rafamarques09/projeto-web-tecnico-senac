(function () {
    const u = Sessao.usuario();
    if (Sessao.token() && u) { location.replace(Sessao.home(u.perfil)); return; }

    const form = document.getElementById('form-cadastro');
    const aviso = document.getElementById('aviso');
    const btn = document.getElementById('enviar');
    const f = (id) => document.getElementById(id);
    let enviando = false;

    f('cpf').addEventListener('input', (e) => { e.target.value = U.mascaraCPF(e.target.value); });
    f('telefone').addEventListener('input', (e) => { e.target.value = U.mascaraTelefone(e.target.value); });

    const regras = {
        nome: (v) => (v.trim().length < 2 ? 'Informe seu nome completo.' : v.trim().length > 100 ? 'Use até 100 caracteres.' : ''),
        email: (v) => (!v.trim() ? 'Informe seu e-mail.' : !U.emailValido(v.trim()) ? 'Informe um e-mail válido.' : ''),
        cpf: (v) => (!v ? 'Informe seu CPF.' : !U.cpfValido(v) ? 'CPF inválido. Confira os números.' : ''),
        telefone: (v) => { const d = U.digitos(v).length; return !v ? 'Informe seu telefone.' : (d < 10 || d > 11) ? 'Informe DDD e número, com 10 ou 11 dígitos.' : ''; },
        senha: (v) => (!v ? 'Crie uma senha.' : !U.senhaValida(v) ? 'A senha deve ter de 8 a 72 caracteres.' : ''),
        confirma: (v) => (!v ? 'Confirme sua senha.' : v !== f('senha').value ? 'As senhas não coincidem.' : '')
    };
    const validar = (campo) => { const msg = regras[campo](f(campo).value); U.erroCampo(f(campo), msg); return msg; };

    Object.keys(regras).forEach((c) => f(c).addEventListener('blur', () => { if (f(c).value) validar(c); }));
    f('senha').addEventListener('input', () => { if (f('confirma').value) validar('confirma'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (enviando) return;
        U.alerta(aviso, '');
        const invalidos = Object.keys(regras).filter((c) => validar(c));
        if (invalidos.length) { f(invalidos[0]).focus(); return; }

        enviando = true; U.carregando(btn, true, 'Criando conta...');
        const r = await Api.post('/auth/cadastro', {
            nome: f('nome').value.trim(),
            email: f('email').value.trim(),
            cpf: U.digitos(f('cpf').value),
            telefone: f('telefone').value.trim(),
            senha: f('senha').value
        }, { auth: false });
        if (!r.ok) {
            enviando = false; U.carregando(btn, false);
            U.alerta(aviso, r.message || 'Não foi possível criar a conta.');
            return;
        }
        location.replace('login.html?cadastro=ok');
    });
})();
