(async function () {
    const ctx = UI.iniciar({ perfis: ['TUTOR'], pagina: 'guia.html', titulo: 'Guia pré-operatória', sub: 'Orientações gerais para o dia da castração.' });
    if (!ctx) return;
    const c = ctx.conteudo, u = ctx.usuario;
    ctx.acoes.innerHTML = '<button class="btn btn-secondary" type="button" id="imprimir"><i data-icon="printer"></i>Imprimir</button>';
    document.getElementById('imprimir').onclick = () => window.print();
    U.icones();

    const guia = `<section class="panel"><div class="panel-b guia">
      <div class="note"><i data-icon="alert-circle"></i><span>Os períodos de jejum e os cuidados específicos dependem do animal e do protocolo da clínica. Confirme tudo com a equipe veterinária responsável antes do dia do procedimento.</span></div>
      <h2>Preparação antes da cirurgia</h2><ul><li>Confirme a data e o horário da solicitação aprovada.</li><li>Informe à clínica doenças, alergias, uso de medicamentos e qualquer mudança no comportamento do animal.</li><li>Em caso de imprevisto, cancele a solicitação na plataforma para liberar a vaga.</li></ul>
      <h2>Jejum alimentar</h2><ul><li>O tempo de jejum varia conforme espécie, idade e orientação da clínica.</li><li>Siga exatamente o período informado pela equipe veterinária; não presuma um horário padrão.</li></ul>
      <h2>Jejum hídrico</h2><ul><li>Confirme com a clínica se e quando a água deve ser retirada antes do procedimento.</li></ul>
      <h2>Transporte do animal</h2><ul><li>Cães: use coleira ou peitoral e guia.</li><li>Gatos: use caixa de transporte firme e bem fechada.</li><li>Mantenha o animal contido durante todo o trajeto e na espera.</li></ul>
      <h2>Documentos necessários</h2><ul><li>Documento de identificação com foto do tutor.</li><li>Número do CadÚnico, se informado na solicitação.</li><li>Esta guia, impressa ou no celular. Confirme com a clínica se outros documentos são exigidos.</li></ul>
      <h2>Cuidados após o procedimento</h2><ul><li>Siga as orientações de alta fornecidas pela clínica.</li><li>Mantenha o animal em local calmo, limpo e supervisionado.</li><li>Observe a região operada e entre em contato com a clínica diante de qualquer alteração.</li></ul>
      <h2>Orientações para cães</h2><ul><li>Passeios apenas com guia durante a recuperação, conforme orientação da clínica.</li><li>Evite que o cão lamba ou morda a região operada.</li></ul>
      <h2>Orientações para gatos</h2><ul><li>Mantenha o gato dentro de casa e em ambiente tranquilo durante a recuperação.</li><li>Siga as orientações da clínica sobre repouso e alimentação.</li></ul></div></section>`;

    async function carregar() {
        c.innerHTML = UI.skeleton(3);
        const r = await Api.get('/solicitacoes');
        if (!r.ok) return UI.falha(c, r.message, carregar);
        const ap = r.data.filter((x) => ['APROVADO', 'CHECKIN'].includes(x.status));
        const enc = ap.length
            ? `<section class="panel"><div class="panel-h"><h2>Seu encaminhamento</h2></div><div class="panel-b stack">${ap.map((s) => `<dl class="dl"><dt>Tutor</dt><dd>${UI.esc(u.nome)}</dd><dt>Animal</dt><dd>${UI.esc(s.animal_nome)} (${UI.ESPECIE[s.especie] || ''})</dd><dt>Data</dt><dd>${UI.data(s.data)}</dd><dt>Horário</dt><dd>${s.horario}</dd><dt>Situação</dt><dd>${UI.badge(s.status)}</dd>${s.cad_unico ? `<dt>CadÚnico</dt><dd>${UI.esc(s.cad_unico)}</dd>` : ''}<dt>Solicitação nº</dt><dd>${s.id}</dd></dl>`).join('<hr style="border:0;border-top:1px solid var(--border);width:100%">')}</div></section>`
            : `<section class="panel">${UI.vazio('file-text', 'Nenhum encaminhamento disponível', 'Os dados do seu atendimento aparecem aqui quando uma solicitação for aprovada.', UI.atalho('solicitar.html', 'plus', 'Solicitar castração', 'btn btn-primary btn-sm'))}</section>`;
        c.innerHTML = `<div class="stack">${enc}${guia}</div>`; U.icones();
    }
    carregar();
})();
