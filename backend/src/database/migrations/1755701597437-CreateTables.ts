import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1755701597437 implements MigrationInterface {
    name = 'CreateTables1755701597437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create quiz_sessions table
        await queryRunner.query(`CREATE TABLE \`quiz_sessions\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('waiting', 'active', 'paused', 'finished') NOT NULL DEFAULT 'waiting', \`current_question_id\` varchar(36) NULL, \`current_round\` int NOT NULL DEFAULT '1', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_2f3005ad9fd7315dc2d515a57c\` (\`status\`), UNIQUE INDEX \`IDX_dc8961dedb47a7f7aa68203534\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create teams table
        await queryRunner.query(`CREATE TABLE \`teams\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`score\` decimal(10,2) NOT NULL DEFAULT '0.00', \`quiz_session_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create questions table
        await queryRunner.query(`CREATE TABLE \`questions\` (\`id\` varchar(36) NOT NULL, \`text\` text NOT NULL, \`type\` enum ('multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video') NOT NULL, \`options\` json NULL, \`correct_answer\` text NULL, \`sequence_items\` json NULL, \`fun_fact\` text NULL, \`time_limit\` int NULL, \`media_url\` varchar(500) NULL, \`numerical_answer\` decimal(10,2) NULL, \`numerical_tolerance\` decimal(10,2) NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create answers table
        await queryRunner.query(`CREATE TABLE \`answers\` (\`id\` varchar(36) NOT NULL, \`text\` text NOT NULL, \`is_correct\` tinyint NULL, \`score\` decimal(10,2) NOT NULL DEFAULT '0.00', \`question_id\` varchar(36) NOT NULL, \`team_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create sequence_answers table
        await queryRunner.query(`CREATE TABLE \`sequence_answers\` (\`id\` varchar(36) NOT NULL, \`item_text\` varchar(255) NOT NULL, \`position\` int NOT NULL, \`answer_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create session_events table
        await queryRunner.query(`CREATE TABLE \`session_events\` (\`id\` varchar(36) NOT NULL, \`event_type\` enum ('session_started', 'session_paused', 'session_resumed', 'session_ended', 'question_started', 'question_ended', 'answer_submitted', 'team_joined', 'team_left', 'round_started', 'round_ended') NOT NULL, \`event_data\` json NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_1ac48c6b4bfd3e49af85c7ed43\` (\`event_type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create themes table
        await queryRunner.query(`CREATE TABLE \`themes\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create question_sets table
        await queryRunner.query(`CREATE TABLE \`question_sets\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`theme_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create session_configurations table
        await queryRunner.query(`CREATE TABLE \`session_configurations\` (\`id\` varchar(36) NOT NULL, \`session_code\` varchar(10) NOT NULL, \`total_rounds\` int NOT NULL DEFAULT '1', \`round_configurations\` json NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create api_keys table
        await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` varchar(36) NOT NULL, \`key\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5c4c0c3b8b8b8b8b8b8b8b8b8\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE \`teams\` ADD CONSTRAINT \`FK_25625a54d2f8db829de07c94198\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD CONSTRAINT \`FK_677849786911ab52bae12872cc4\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answers\` ADD CONSTRAINT \`FK_677120094cf6d3f12df0b9dc5d3\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answers\` ADD CONSTRAINT \`FK_5c04afcc099c44346ae5bdedabb\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sequence_answers\` ADD CONSTRAINT \`FK_59209c26fe5f0b9d0fa170f2873\` FOREIGN KEY (\`answer_id\`) REFERENCES \`answers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD CONSTRAINT \`FK_0cb6c698e5525d3662408748f41\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` ADD CONSTRAINT \`FK_question_sets_theme\` FOREIGN KEY (\`theme_id\`) REFERENCES \`themes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE \`question_sets\` DROP FOREIGN KEY \`FK_question_sets_theme\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP FOREIGN KEY \`FK_0cb6c698e5525d3662408748f41\``);
        await queryRunner.query(`ALTER TABLE \`sequence_answers\` DROP FOREIGN KEY \`FK_59209c26fe5f0b9d0fa170f2873\``);
        await queryRunner.query(`ALTER TABLE \`answers\` DROP FOREIGN KEY \`FK_5c04afcc099c44346ae5bdedabb\``);
        await queryRunner.query(`ALTER TABLE \`answers\` DROP FOREIGN KEY \`FK_677120094cf6d3f12df0b9dc5d3\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP FOREIGN KEY \`FK_677849786911ab52bae12872cc4\``);
        await queryRunner.query(`ALTER TABLE \`teams\` DROP FOREIGN KEY \`FK_25625a54d2f8db829de07c94198\``);

        // Drop tables
        await queryRunner.query(`DROP TABLE \`api_keys\``);
        await queryRunner.query(`DROP TABLE \`session_configurations\``);
        await queryRunner.query(`DROP TABLE \`question_sets\``);
        await queryRunner.query(`DROP TABLE \`themes\``);
        await queryRunner.query(`DROP TABLE \`session_events\``);
        await queryRunner.query(`DROP TABLE \`sequence_answers\``);
        await queryRunner.query(`DROP TABLE \`answers\``);
        await queryRunner.query(`DROP TABLE \`questions\``);
        await queryRunner.query(`DROP TABLE \`teams\``);
        await queryRunner.query(`DROP TABLE \`quiz_sessions\``);
    }
}
