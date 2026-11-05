-- CastraPet - script do banco de dados (MySQL 8.0.16+)
-- Execute o arquivo inteiro no MySQL Workbench.
-- Os usuários de demonstração são criados depois, por: npm run seed (dentro de backend/)
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS castrapet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE castrapet;

-- 1) USUÁRIOS: todos que entram no sistema (o perfil define as permissões)
--    TUTOR = cidadão | CLINICA = login da clínica conveniada | ADMIN = prefeitura
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,                 -- hash bcrypt, nunca a senha original
    cpf CHAR(11) NULL UNIQUE,                    
    telefone VARCHAR(20) NULL,
    perfil ENUM('ADMIN', 'CLINICA', 'TUTOR') NOT NULL DEFAULT 'TUTOR',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 2) AGENDA: horários em que a clínica atende e quantas castrações cabem em cada um
CREATE TABLE IF NOT EXISTS agenda (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    vagas INT UNSIGNED NOT NULL,                 -- castrações que cabem neste horário
    ativa BOOLEAN NOT NULL DEFAULT TRUE,         -- a clínica pode fechar o horário
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_agenda_data_horario UNIQUE (data, horario),
    CONSTRAINT ck_agenda_vagas CHECK (vagas > 0)
) ENGINE = InnoDB;

-- 3) ANIMAIS: pertencem a um tutor; o microchip é único no sistema
CREATE TABLE IF NOT EXISTS animais (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT UNSIGNED NOT NULL,
    nome VARCHAR(80) NOT NULL,
    especie ENUM('CAO', 'GATO') NOT NULL,
    sexo ENUM('MACHO', 'FEMEA') NOT NULL,
    raca VARCHAR(60) NULL,
    porte ENUM('PEQUENO', 'MEDIO', 'GRANDE') NULL,
    idade_meses SMALLINT UNSIGNED NULL,
    microchip CHAR(15) NULL UNIQUE,              -- preenchido pela clínica após a cirurgia
    castrado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_animal_tutor FOREIGN KEY (tutor_id) REFERENCES usuarios(id),
    INDEX idx_animal_tutor (tutor_id)
) ENGINE = InnoDB;

-- 4) SOLICITAÇÕES: o tutor escolhe o horário ao solicitar; a prefeitura aprova ou recusa
CREATE TABLE IF NOT EXISTS solicitacoes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    animal_id INT UNSIGNED NOT NULL,
    agenda_id INT UNSIGNED NOT NULL,             -- horário escolhido pelo tutor
    status ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO')
        NOT NULL DEFAULT 'PENDENTE',
    cad_unico VARCHAR(20) NULL,
    observacoes TEXT NULL,
    justificativa_recusa VARCHAR(255) NULL,
    data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_conclusao DATETIME NULL,
    CONSTRAINT fk_solic_animal FOREIGN KEY (animal_id) REFERENCES animais(id),
    CONSTRAINT fk_solic_agenda FOREIGN KEY (agenda_id) REFERENCES agenda(id),
    INDEX idx_solic_status (status),
    INDEX idx_solic_agenda (agenda_id)
) ENGINE = InnoDB;