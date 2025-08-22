import { MigrationInterface, QueryRunner } from "typeorm";

export class AddThemesAndQuestionSets1755852685095 implements MigrationInterface {
    name = 'AddThemesAndQuestionSets1755852685095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`session_configurations\` (\`id\` varchar(36) NOT NULL, \`quiz_session_id\` varchar(36) NOT NULL, \`total_rounds\` int NOT NULL DEFAULT '1', \`round_configurations\` json NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_9a39ae30960105ac211c1a8c36\` (\`quiz_session_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`question_sets\` (\`id\` varchar(36) NOT NULL, \`theme_id\` varchar(36) NOT NULL, \`type\` enum ('multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video') NOT NULL, \`question_text\` text NOT NULL, \`fun_fact\` text NULL, \`time_limit\` int NULL, \`points\` int NOT NULL DEFAULT '1', \`options\` json NULL, \`correct_answer\` text NULL, \`sequence_items\` json NULL, \`media_url\` varchar(500) NULL, \`numerical_answer\` decimal(15,4) NULL, \`numerical_tolerance\` decimal(15,4) NULL, \`difficulty\` enum ('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_81a1af45991fcf18a7d5d66917\` (\`theme_id\`, \`is_active\`), INDEX \`IDX_513ad627e06231c44cb09fef2b\` (\`theme_id\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`themes\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_b15e38dec53aa2b0216e756465\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` varchar(36) NOT NULL, \`key_name\` varchar(255) NOT NULL, \`api_key\` varchar(255) NOT NULL, \`permissions\` json NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`last_used\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_4dba6b5b03ec5b2ce3d345b540\` (\`api_key\`, \`is_active\`), UNIQUE INDEX \`IDX_9ccce5863aec84d045d778179d\` (\`api_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`answers\` CHANGE \`is_correct\` \`is_correct\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`fun_fact\` \`fun_fact\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`time_limit\` \`time_limit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`options\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`correct_answer\` \`correct_answer\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`sequence_items\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`media_url\` \`media_url\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`numerical_answer\` \`numerical_answer\` decimal(15,4) NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`numerical_tolerance\` \`numerical_tolerance\` decimal(15,4) NULL`);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`quiz_sessions\` CHANGE \`current_question_id\` \`current_question_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`session_configurations\` ADD CONSTRAINT \`FK_9a39ae30960105ac211c1a8c360\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` ADD CONSTRAINT \`FK_f5ed05b07c9206b52701b7b7aa4\` FOREIGN KEY (\`theme_id\`) REFERENCES \`themes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question_sets\` DROP FOREIGN KEY \`FK_f5ed05b07c9206b52701b7b7aa4\``);
        await queryRunner.query(`ALTER TABLE \`session_configurations\` DROP FOREIGN KEY \`FK_9a39ae30960105ac211c1a8c360\``);
        await queryRunner.query(`ALTER TABLE \`quiz_sessions\` CHANGE \`current_question_id\` \`current_question_id\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`numerical_tolerance\` \`numerical_tolerance\` decimal(15,4) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`numerical_answer\` \`numerical_answer\` decimal(15,4) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`media_url\` \`media_url\` varchar(500) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`sequence_items\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`correct_answer\` \`correct_answer\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`options\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`time_limit\` \`time_limit\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`fun_fact\` \`fun_fact\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`answers\` CHANGE \`is_correct\` \`is_correct\` tinyint NULL DEFAULT 'NULL'`);
        await queryRunner.query(`DROP INDEX \`IDX_9ccce5863aec84d045d778179d\` ON \`api_keys\``);
        await queryRunner.query(`DROP INDEX \`IDX_4dba6b5b03ec5b2ce3d345b540\` ON \`api_keys\``);
        await queryRunner.query(`DROP TABLE \`api_keys\``);
        await queryRunner.query(`DROP INDEX \`IDX_b15e38dec53aa2b0216e756465\` ON \`themes\``);
        await queryRunner.query(`DROP TABLE \`themes\``);
        await queryRunner.query(`DROP INDEX \`IDX_513ad627e06231c44cb09fef2b\` ON \`question_sets\``);
        await queryRunner.query(`DROP INDEX \`IDX_81a1af45991fcf18a7d5d66917\` ON \`question_sets\``);
        await queryRunner.query(`DROP TABLE \`question_sets\``);
        await queryRunner.query(`DROP INDEX \`IDX_9a39ae30960105ac211c1a8c36\` ON \`session_configurations\``);
        await queryRunner.query(`DROP TABLE \`session_configurations\``);
    }

}
