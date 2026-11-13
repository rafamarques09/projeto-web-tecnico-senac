# CastraPet: início rápido

Sistema web que organiza o programa municipal de **castração gratuita de cães e gatos**: agenda online com vagas por horário, triagem pela prefeitura e registro do **microchip** de cada animal atendido.

> Quer ver o projeto completo (banco de dados, rotas, permissões, regras de negócio e testes)? Veja o [README](README.md).

---

## Sobre o projeto

### O problema

O município oferece castração gratuita para famílias em situação de vulnerabilidade social, em parceria com uma clínica veterinária conveniada. O atendimento enfrenta três gargalos:

- **Controle descentralizado:** solicitações, horários e fila de espera são geridos manualmente ou em planilhas, o que gera conflitos de horário e vagas além da capacidade da clínica.
- **Falta de rastreabilidade:** animais castrados nem sempre têm um registro digital ligado ao número do microchip, o que dificulta a fiscalização do abandono e o histórico do animal.
- **Comunicação falha com o tutor:** sem um guia padronizado de orientações pré-operatórias (jejum, transporte, documentos), ocorrem faltas e cirurgias canceladas.

**Quem é afetado:** as famílias que dependem do programa, a prefeitura (que faz a triagem) e a clínica conveniada (que executa os procedimentos).

### Justificativa

Centralizar a agenda, registrar o microchip e orientar o tutor reduz faltas e retrabalho, dá à prefeitura controle sobre quem é atendido e cria um histórico digital de cada animal, o que apoia a fiscalização e o combate ao abandono.

### A solução

Um sistema web que automatiza todo o ciclo do programa, com três perfis de usuário:

| Perfil | O que faz no sistema |
| :--- | :--- |
| **Tutor** | Cadastra seus animais; solicita a castração escolhendo um horário com vaga; acompanha o pedido; consulta a Guia Pré-Operatória. |
| **Prefeitura** (`ADMIN`) | Faz a triagem (aprova ou recusa os pedidos, com justificativa); acompanha a agenda, os animais e os usuários. |
| **Clínica** (`CLINICA`) | Define os dias e horários de atendimento e as vagas; recebe os animais aprovados; faz o check-in e registra o microchip. |

### Como funciona

```text
[Clínica] Abre dias e horários na agenda, com número de vagas
   │
   ▼
[Tutor] Cadastra o animal e solicita a castração escolhendo um horário com vaga
   │
   ▼
[Prefeitura] Analisa o pedido na triagem
   │
   ├──▶ (Recusado) ──▶ O tutor vê a justificativa e a vaga volta para a agenda
   │
   ▼ (Aprovado)
[Tutor] Leva o animal no dia e horário marcados, seguindo a Guia Pré-Operatória
   │
   ▼
[Clínica] Faz o check-in, a cirurgia e registra o NÚMERO DO MICROCHIP
   │
   ▼
[Sistema] Atualiza o histórico do animal como "Castrado e Microchipado"
```

O sistema não permite marcar mais animais do que as vagas de cada horário.

---

## Como rodar na sua máquina

### O que você precisa ter instalado

- [Node.js](https://nodejs.org) 20 ou superior (confira com `node -v`)
- [MySQL](https://dev.mysql.com/downloads/) 8.0.16 ou superior, com o MySQL Workbench
- [Git](https://git-scm.com)

### Passo a passo

**1. Baixe o projeto**

```bash
git clone https://github.com/rafamarques09/projeto-web-tecnico-senac.git
cd projeto-web-tecnico-senac
```

**2. Crie o banco de dados**

No MySQL Workbench, conecte no seu servidor e execute **nesta ordem**:

1. `sql/agendamentoCastrapet.sql` (cria o banco e as tabelas)
2. `sql/dadosTeste.sql` (cria usuários, horários e animais de demonstração)

**3. Instale as dependências**

```bash
cd backend
npm install
```

**4. Configure o ambiente**

Copie o arquivo de exemplo para `.env`:

```bash
# Windows (PowerShell)
copy .env.example .env

# Mac ou Linux
cp .env.example .env
```

Abra o `backend/.env` e preencha duas linhas:

- `DB_PASSWORD=` a senha do seu MySQL (deixe vazio se o seu usuário root não tem senha).
- `JWT_SECRET=` um texto longo e aleatório, com no mínimo 32 caracteres. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copie o resultado e cole depois do `=`.

**5. Inicie o sistema**

```bash
npm run dev
```

**6. Abra no navegador**

**http://localhost:3000** (o mesmo servidor entrega o site e a API).

---

## Entre e conheça o sistema

Use as contas de demonstração (apenas para testes locais):

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| Tutor | tutor@castrapet.com | Tutor@123 |
| Prefeitura | admin@castrapet.com | Admin@123 |
| Clínica | clinica@castrapet.com | Clinica@123 |

**Um passeio de 2 minutos:**

1. Entre como **tutor**, veja o animal Thor com um pedido pendente e, em **Solicitar castração**, peça um horário para a Mia.
2. Saia, entre como **prefeitura** e, em **Triagem**, aprove o pedido do Thor.
3. Saia, entre como **clínica**, vá em **Atendimentos**, faça o check-in do Thor e conclua com um microchip de 15 dígitos (por exemplo, `985112345678901`).
4. Volte ao **tutor** e veja o Thor com o microchip registrado.

---

## Se algo der errado

| Mensagem ou sintoma | O que fazer |
| :--- | :--- |
| `Configure JWT_SECRET com ao menos 32 caracteres` | Preencha o `JWT_SECRET` no `backend/.env` (passo 4). |
| `ER_ACCESS_DENIED_ERROR` | Usuário ou senha do MySQL errados. Confira `DB_USER` e `DB_PASSWORD` no `.env`. |
| `ECONNREFUSED` | O MySQL não está ligado. Inicie o serviço e tente de novo. |
| `ER_BAD_DB_ERROR` (banco desconhecido) | Os scripts do passo 2 não foram executados. |
| `EADDRINUSE` (porta 3000 ocupada) | Feche o outro programa que usa a porta 3000, ou mude `PORT` no `.env`. |
| O login das contas de demonstração não funciona | Confira se o `dadosTeste.sql` foi executado depois do `agendamentoCastrapet.sql`. |
| A agenda não mostra horários futuros | Os horários de teste são criados para 7, 14 e 21 dias depois da execução do script. Como clínica, cadastre novos horários na tela **Agenda**. |
| A página abre sem estilo ou sem dados | Acesse por `http://localhost:3000`, e não abrindo o arquivo HTML direto do computador. |
