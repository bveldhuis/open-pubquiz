import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1755936074337 implements MigrationInterface {
    name = 'CreateTables1755936074337'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`fun_fact\` \`fun_fact\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`time_limit\` \`time_limit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`question_sets\` ADD \`options\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`correct_answer\` \`correct_answer\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`question_sets\` ADD \`sequence_items\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`media_url\` \`media_url\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`numerical_answer\` \`numerical_answer\` decimal(15,4) NULL`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`numerical_tolerance\` \`numerical_tolerance\` decimal(15,4) NULL`);
        await queryRunner.query(`ALTER TABLE \`themes\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`api_keys\` CHANGE \`last_used\` \`last_used\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`api_keys\` CHANGE \`last_used\` \`last_used\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`themes\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`numerical_tolerance\` \`numerical_tolerance\` decimal(15,4) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`numerical_answer\` \`numerical_answer\` decimal(15,4) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`media_url\` \`media_url\` varchar(500) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`question_sets\` ADD \`sequence_items\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`correct_answer\` \`correct_answer\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`question_sets\` ADD \`options\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`time_limit\` \`time_limit\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`question_sets\` CHANGE \`fun_fact\` \`fun_fact\` text NULL DEFAULT 'NULL'`);
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
    }

}
