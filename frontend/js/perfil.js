(async function () {
    const ctx = UI.iniciar({ perfis: ['ADMIN', 'CLINICA', 'TUTOR'], pagina: 'perfil.html', titulo: 'Meu perfil', sub: 'Dados da sua conta.' });
    if (!ctx) return;
    const c = ctx.conteudo;
    const DESC = { TUTOR: 'Cadastra animais, solicita castrações e acompanha o atendimento.', CLINICA: 'Gerencia a agenda e registra check-in, microchip e conclusão dos atendimentos.', ADMIN: 'Analisa solicitações e gerencia usuários, animais e agenda.' };
    async function carregar() {
        c.innerHTML = UI.skeleton(2);
        const r = await Api.get('/auth/perfil');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        let u = r.data.usuario;
        if (u.perfil === 'ADMIN') { const l = await Api.get('/usuarios'); const m = l.ok && l.data.find((x) => x.id === u.id); if (m) u = { ...u, ...m }; }
        const linha = (t, v) => (v ? `<dt>${t}</dt><dd>${v}</dd>` : '');
        c.innerHTML = `<div class="cols"><section class="panel"><div class="panel-h"><h2>Dados pessoais</h2></div><div class="panel-b"><dl class="dl">
          ${linha('Nome', UI.esc(u.nome))}${linha('E-mail', UI.esc(u.email))}${linha('Telefone', UI.esc(u.telefone))}${linha('CPF', u.cpf ? U.mascaraCPF(u.cpf) : '')}${linha('Membro desde', u.criado_em ? UI.data(u.criado_em) : '')}</dl>
          <p class="hint" style="margin:var(--s4) 0 0">A edição dos dados pessoais ainda não está disponível na plataforma.</p></div></section>
          <section class="panel"><div class="panel-h"><h2>Acesso</h2></div><div class="panel-b"><p style="margin-top:0"><span class="badge badge-${u.perfil}">${UI.PERFIL[u.perfil]}</span></p><p class="muted" style="margin:0">${DESC[u.perfil] || ''}</p></div></section></div>`;
    }
    carregar();
})();
