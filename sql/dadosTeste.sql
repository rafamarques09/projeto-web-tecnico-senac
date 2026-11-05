USE castrapet;

-- AGENDA: 3 dias de atendimento, relativos à data de hoje
-- (INSERT IGNORE pula horários repetidos, por causa do UNIQUE data+horario)
INSERT IGNORE INTO agenda (data, horario, vagas) VALUES
    (DATE_ADD(CURDATE(), INTERVAL 7 DAY),  '09:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 7 DAY),  '10:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 14 DAY), '09:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 14 DAY), '10:00:00', 2),
    (DATE_ADD(CURDATE(), INTERVAL 21 DAY), '09:00:00', 3);

-- ANIMAIS: dois animais do tutor de demonstração
-- Busca o tutor pelo e-mail para não depender de IDs fixos
SET @tutor_id = (SELECT id FROM usuarios WHERE email = 'tutor@castrapet.com');

INSERT INTO animais (tutor_id, nome, especie, sexo, raca, porte, idade_meses) VALUES
    (@tutor_id, 'Thor', 'CAO',  'MACHO', 'Vira-lata', 'MEDIO',   18),
    (@tutor_id, 'Mia',  'GATO', 'FEMEA', 'SRD',       'PEQUENO', 10);

-- SOLICITAÇÃO: o Thor já tem um pedido pendente no primeiro horário da agenda
-- (a Mia fica sem pedido, para você testar a solicitação pelo sistema na Entrega 3)
SET @thor_id = (SELECT id FROM animais WHERE nome = 'Thor' AND tutor_id = @tutor_id LIMIT 1);
SET @primeiro_horario = (SELECT id FROM agenda ORDER BY data, horario LIMIT 1);

INSERT INTO solicitacoes (animal_id, agenda_id, status, cad_unico, observacoes) VALUES
    (@thor_id, @primeiro_horario, 'PENDENTE', '12345678901', 'Família beneficiária de programa social.');

SELECT * FROM agenda;
SELECT * FROM animais;
SELECT s.id, a.nome AS animal, ag.data, ag.horario, s.status
FROM solicitacoes s
JOIN animais a  ON a.id = s.animal_id
JOIN agenda ag  ON ag.id = s.agenda_id;