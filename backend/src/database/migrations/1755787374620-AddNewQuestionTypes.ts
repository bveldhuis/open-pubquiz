import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewQuestionTypes1755787374620 implements MigrationInterface {
    name = 'AddNewQuestionTypes1755787374620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`media_url\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`numerical_answer\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`numerical_tolerance\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`answers\` CHANGE \`is_correct\` \`is_correct\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`type\` \`type\` enum ('multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`fun_fact\` \`fun_fact\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`time_limit\` \`time_limit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`options\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`correct_answer\` \`correct_answer\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`sequence_items\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`quiz_sessions\` CHANGE \`current_question_id\` \`current_question_id\` varchar(36) NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_1ac48c6b4bfd3e49af85c7ed43\` ON \`session_events\` (\`event_type\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_1ac48c6b4bfd3e49af85c7ed43\` ON \`session_events\``);
        await queryRunner.query(`ALTER TABLE \`quiz_sessions\` CHANGE \`current_question_id\` \`current_question_id\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`sequence_items\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`correct_answer\` \`correct_answer\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`options\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`time_limit\` \`time_limit\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`fun_fact\` \`fun_fact\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`type\` \`type\` enum ('multiple_choice', 'open_text', 'sequence') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`answers\` CHANGE \`is_correct\` \`is_correct\` tinyint NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`numerical_tolerance\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`numerical_answer\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`media_url\``);
    }

}
