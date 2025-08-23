import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1755936074337 implements MigrationInterface {
    name = 'CreateTables1755936074337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create themes table
        await queryRunner.query(`CREATE TABLE \`themes\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create api_keys table
        await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` varchar(36) NOT NULL, \`key_hash\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`last_used\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create quiz_sessions table
        await queryRunner.query(`CREATE TABLE \`quiz_sessions\` (\`id\` varchar(36) NOT NULL, \`session_code\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum('waiting', 'active', 'paused', 'finished') NOT NULL DEFAULT 'waiting', \`current_question_id\` varchar(36) NULL, \`current_round\` int NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_session_code\` (\`session_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create session_configurations table
        await queryRunner.query(`CREATE TABLE \`session_configurations\` (\`id\` varchar(36) NOT NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`round_number\` int NOT NULL, \`round_name\` varchar(255) NOT NULL, \`time_limit\` int NULL, \`points_per_question\` int NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create teams table
        await queryRunner.query(`CREATE TABLE \`teams\` (\`id\` varchar(36) NOT NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`score\` int NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create questions table
        await queryRunner.query(`CREATE TABLE \`questions\` (\`id\` varchar(36) NOT NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`round_number\` int NOT NULL, \`question_number\` int NOT NULL, \`type\` enum('multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video') NOT NULL, \`question_text\` text NOT NULL, \`fun_fact\` text NULL, \`time_limit\` int NULL, \`points\` int NOT NULL DEFAULT 1, \`options\` json NULL, \`correct_answer\` text NULL, \`sequence_items\` json NULL, \`media_url\` varchar(500) NULL, \`numerical_answer\` decimal(15,4) NULL, \`numerical_tolerance\` decimal(15,4) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_quiz_session_id\` (\`quiz_session_id\`), INDEX \`IDX_round_question\` (\`round_number\`, \`question_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create answers table
        await queryRunner.query(`CREATE TABLE \`answers\` (\`id\` varchar(36) NOT NULL, \`question_id\` varchar(36) NOT NULL, \`team_id\` varchar(36) NOT NULL, \`answer_text\` text NOT NULL, \`is_correct\` tinyint NULL, \`points_awarded\` int NOT NULL DEFAULT 0, \`submitted_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_question_id\` (\`question_id\`), INDEX \`IDX_team_id\` (\`team_id\`), UNIQUE INDEX \`IDX_team_question\` (\`team_id\`, \`question_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create sequence_answers table
        await queryRunner.query(`CREATE TABLE \`sequence_answers\` (\`id\` varchar(36) NOT NULL, \`answer_id\` varchar(36) NOT NULL, \`item_text\` varchar(255) NOT NULL, \`position\` int NOT NULL, \`is_correct\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create session_events table
        await queryRunner.query(`CREATE TABLE \`session_events\` (\`id\` varchar(36) NOT NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`event_type\` varchar(50) NOT NULL, \`event_data\` json NULL, \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Create question_sets table
        await queryRunner.query(`CREATE TABLE \`question_sets\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`type\` enum('multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video') NOT NULL, \`question_text\` text NOT NULL, \`fun_fact\` text NULL, \`time_limit\` int NULL, \`points\` int NOT NULL DEFAULT 1, \`options\` json NULL, \`correct_answer\` text NULL, \`sequence_items\` json NULL, \`media_url\` varchar(500) NULL, \`numerical_answer\` decimal(15,4) NULL, \`numerical_tolerance\` decimal(15,4) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE \`session_configurations\` ADD CONSTRAINT \`FK_session_configurations_quiz_session\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`teams\` ADD CONSTRAINT \`FK_teams_quiz_session\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD CONSTRAINT \`FK_questions_quiz_session\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answers\` ADD CONSTRAINT \`FK_answers_question\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answers\` ADD CONSTRAINT \`FK_answers_team\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sequence_answers\` ADD CONSTRAINT \`FK_sequence_answers_answer\` FOREIGN KEY (\`answer_id\`) REFERENCES \`answers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD CONSTRAINT \`FK_session_events_quiz_session\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP FOREIGN KEY \`FK_session_events_quiz_session\``);
        await queryRunner.query(`ALTER TABLE \`sequence_answers\` DROP FOREIGN KEY \`FK_sequence_answers_answer\``);
        await queryRunner.query(`ALTER TABLE \`answers\` DROP FOREIGN KEY \`FK_answers_team\``);
        await queryRunner.query(`ALTER TABLE \`answers\` DROP FOREIGN KEY \`FK_answers_question\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP FOREIGN KEY \`FK_questions_quiz_session\``);
        await queryRunner.query(`ALTER TABLE \`teams\` DROP FOREIGN KEY \`FK_teams_quiz_session\``);
        await queryRunner.query(`ALTER TABLE \`session_configurations\` DROP FOREIGN KEY \`FK_session_configurations_quiz_session\``);

        // Drop tables
        await queryRunner.query(`DROP TABLE \`question_sets\``);
        await queryRunner.query(`DROP TABLE \`session_events\``);
        await queryRunner.query(`DROP TABLE \`sequence_answers\``);
        await queryRunner.query(`DROP TABLE \`answers\``);
        await queryRunner.query(`DROP TABLE \`questions\``);
        await queryRunner.query(`DROP TABLE \`teams\``);
        await queryRunner.query(`DROP TABLE \`session_configurations\``);
        await queryRunner.query(`DROP TABLE \`quiz_sessions\``);
        await queryRunner.query(`DROP TABLE \`api_keys\``);
        await queryRunner.query(`DROP TABLE \`themes\``);
    }
}
