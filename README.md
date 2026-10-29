# CastraPet - Sistema de Agendamento e Controle de Castração Animal

Sistema web desenvolvido para gestão de solicitações de castração, identificação eletrônica por microchip e controle de cotas em parceria com clínicas veterinárias conveniadas.

---

## Contextualização e Problema Identificado

No âmbito da gestão de saúde pública e controle populacional de cães e gatos, o município oferece programas de castração gratuita voltados a famílias em situação de vulnerabilidade social. 

Apesar do impacto positivo, o fluxo atual de atendimento enfrenta gargalos operacionais:
* **Falta de Centralização:** O controle de solicitações, cotas mensais das clínicas parceiras e fila de espera é gerido manualmente ou por planilhas descentralizadas.
* **Falta de Rastreabilidade e Identificação:** Animais castrados nem sempre possuem um registro único digital associado ao número do transponder (microchip) inserido no momento da cirurgia, dificultando a fiscalização de abandono e o acompanhamento do histórico do animal.
* **Comunicação Falha com o Tutor:** Inexistência de um guia claro e padronizado com orientações pré-operatórias (como jejum hídrico/alimentar, transporte e documentos necessários), resultando em faltas no dia agendado ou procedimentos cancelados por desconhecimento das regras.

---

## Proposta de Solução

O CastraPet é um sistema web completo em arquitetura Full-Stack que automatiza o ciclo de vida do programa de castração municipal:
1. Permite ao **Tutor/Cidadão** realizar a solicitação online, consultar orientações pré-operatórias e emitir a Guia de Encaminhamento.
2. Disponibiliza para a **Prefeitura (Veterinário/Gestor Municipal)** o controle da fila de triagem, aprovação de cadastros, gerenciamento da cota diária/mensal das clínicas e emissão de relatórios de controle animal.
3. Garante à **Clínica Conveniada** um painel para registrar o atendimento, realizar o check-in do animal, efetuar o vínculo do número do microchip aplicado e dar baixa no procedimento.

---

## Principais Funcionalidades Previstas

- **Gestão de Acesso:** Cadastro, autenticação com JWT e controle de permissões por perfil (`ADMIN`, `CLINICA`, `TUTOR`).
- **Solicitação e Agendamento:** Cadastro de animais vinculado ao tutor e vinculação à clínica conveniada com vaga disponível.
- **Módulo de Microchipagem:** Campo de identificação única do transponder registrado pela clínica pós-procedimento.
- **Manual e Guia Pré-Operatória:** Instruções claras ao tutor sobre o transporte, documentos e jejum do animal.
- **Painel de Triagem:** Interface administrativa para validação das solicitações e gestão de cotas.

---

## Tipos de Usuários e Ações Previstas

| Perfil de Usuário | Permissões e Ações no Sistema |
| :--- | :--- |
| **Cidadão / Tutor** (`TUTOR`) | • Realizar cadastro na plataforma.<br>• Solicitar agendamento de castração informando dados do animal.<br>• Visualizar status da solicitação (Pendente, Aprovado, Concluído).<br>• Acessar a Guia Pré-Operatória com instruções para o dia do procedimento. |
| **Gestor Municipal / Prefeitura** (`ADMIN`) | • Triar e aprovar/recusar solicitações com base na vulnerabilidade.<br>• Cadastrar e gerenciar clínicas parceiras e suas cotas de atendimento.<br>• Visualizar dashboard geral de animais atendidos e microchipados.<br>• Gerenciar todos os cadastros de tutores e animais. |
| **Clínica Conveniada** (`CLINICA`) | • Visualizar a agenda de animais confirmados para a data.<br>• Confirmar presença/check-in do animal na clínica.<br>• Cadastrar o número do microchip aplicado durante o procedimento.<br>• Concluir o atendimento no sistema. |

---

## Fluxo Básico de Funcionamento

```text
[Tutor] Cadastra-se e solicita castração do animal no sistema
   │
   ▼
[Prefeitura / ADMIN] Analisa solicitação na fila de triagem
   │
   ├──▶ (Recusado) ──▶ Notifica tutor com a justificativa
   │
   ▼ (Aprovado)
[Sistema] Aloca vaga na Clínica Conveniada e gera Guia Pré-Operatória para o Tutor
   │
   ▼
[Tutor] Leva o animal à Clínica na data agendada conforme instruções pré-operatórias
   │
   ▼
[Clínica] Realiza a cirurgia, aplica o microchip e registra o NÚMERO DO MICROCHIP na plataforma
   │
   ▼
[Sistema] Finaliza o agendamento e atualiza o histórico do animal como "Castrado e Microchipado"