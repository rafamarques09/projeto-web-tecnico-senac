USE castrapet;

-- USUÁRIOS DE DEMONSTRAÇÃO (senhas protegidas por bcrypt)
INSERT INTO usuarios (nome, email, senha, perfil)
SELECT 'Gestor Municipal', 'admin@castrapet.com', '$2b$10$UQg4lETgn2JVzVaM80YAl.vNEt5z5MTpyfQXLR7SVrOJHrhFcFmNy', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@castrapet.com');

INSERT INTO usuarios (nome, email, senha, perfil)
SELECT 'Clínica Amigo Fiel', 'clinica@castrapet.com', '$2b$10$ShNWpl4rGSs.tNlF6CH7re2wxHEtanPwmvwjvNQrr5e6G1FZH7r.O', 'CLINICA'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'clinica@castrapet.com');

INSERT INTO usuarios (nome, email, senha, perfil)
SELECT 'Tutor Exemplo', 'tutor@castrapet.com', '$2b$10$vRuXXlZWVVpx/bn5VB/1CO28jmsbxBsmWkwJPM/FiveSDAzemR/Vy', 'TUTOR'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'tutor@castrapet.com');

-- AGENDA: dias e horários de atendimento, relativos à data de hoje
INSERT IGNORE INTO agenda (data, horario, vagas) VALUES
    (DATE_ADD(CURDATE(), INTERVAL 7 DAY),  '09:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 7 DAY),  '10:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 14 DAY), '09:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 14 DAY), '10:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 21 DAY), '09:00:00', 3);

-- ANIMAIS do tutor de demonstração
SET @tutor_id = (SELECT id FROM usuarios WHERE email = 'tutor@castrapet.com');

INSERT INTO animais (tutor_id, nome, especie, sexo, raca, porte, idade_meses) VALUES
    (@tutor_id, 'Thor', 'CAO',  'MACHO', 'Vira-lata', 'MEDIO',   18),
    (@tutor_id, 'Mia',  'GATO', 'FEMEA', 'SRD',       'PEQUENO', 10);

-- SOLICITAÇÃO: o Thor tem um pedido pendente no primeiro horário da agenda
SET @thor_id = (SELECT id FROM animais WHERE nome = 'Thor' AND tutor_id = @tutor_id LIMIT 1);
SET @primeiro_horario = (SELECT id FROM agenda ORDER BY data, horario LIMIT 1);

INSERT INTO solicitacoes (animal_id, agenda_id, status, cad_unico, observacoes) VALUES
    (@thor_id, @primeiro_horario, 'PENDENTE', '12345678901', 'Família beneficiária de programa social.');