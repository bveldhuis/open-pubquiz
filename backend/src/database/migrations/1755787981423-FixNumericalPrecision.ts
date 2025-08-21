import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNumericalPrecision1755787981423 implements MigrationInterface {
    name = 'FixNumericalPrecision1755787981423'

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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`quiz_sessions\` CHANGE \`current_question_id\` \`current_question_id\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`numerical_tolerance\` \`numerical_tolerance\` decimal(10,2) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`numerical_answer\` \`numerical_answer\` decimal(10,2) NULL DEFAULT 'NULL'`);
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
