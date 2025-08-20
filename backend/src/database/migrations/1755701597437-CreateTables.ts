import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1755701597437 implements MigrationInterface {
    name = 'CreateTables1755701597437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`quiz_sessions\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('waiting', 'active', 'paused', 'finished') NOT NULL DEFAULT 'waiting', \`current_question_id\` varchar(36) NULL, \`current_round\` int NOT NULL DEFAULT '1', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_2f3005ad9fd7315dc2d515a57c\` (\`status\`), UNIQUE INDEX \`IDX_dc8961dedb47a7f7aa68203534\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`answers\` CHANGE \`is_correct\` \`is_correct\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`fun_fact\` \`fun_fact\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`time_limit\` \`time_limit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`options\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`correct_answer\` \`correct_answer\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`sequence_items\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`teams\` ADD CONSTRAINT \`FK_25625a54d2f8db829de07c94198\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sequence_answers\` ADD CONSTRAINT \`FK_59209c26fe5f0b9d0fa170f2873\` FOREIGN KEY (\`answer_id\`) REFERENCES \`answers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answers\` ADD CONSTRAINT \`FK_677120094cf6d3f12df0b9dc5d3\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answers\` ADD CONSTRAINT \`FK_5c04afcc099c44346ae5bdedabb\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD CONSTRAINT \`FK_677849786911ab52bae12872cc4\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD CONSTRAINT \`FK_0cb6c698e5525d3662408748f41\` FOREIGN KEY (\`quiz_session_id\`) REFERENCES \`quiz_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP FOREIGN KEY \`FK_0cb6c698e5525d3662408748f41\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP FOREIGN KEY \`FK_677849786911ab52bae12872cc4\``);
        await queryRunner.query(`ALTER TABLE \`answers\` DROP FOREIGN KEY \`FK_5c04afcc099c44346ae5bdedabb\``);
        await queryRunner.query(`ALTER TABLE \`answers\` DROP FOREIGN KEY \`FK_677120094cf6d3f12df0b9dc5d3\``);
        await queryRunner.query(`ALTER TABLE \`sequence_answers\` DROP FOREIGN KEY \`FK_59209c26fe5f0b9d0fa170f2873\``);
        await queryRunner.query(`ALTER TABLE \`teams\` DROP FOREIGN KEY \`FK_25625a54d2f8db829de07c94198\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_data\``);
        await queryRunner.query(`ALTER TABLE \`session_events\` ADD \`event_data\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`sequence_items\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`sequence_items\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`correct_answer\` \`correct_answer\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP COLUMN \`options\``);
        await queryRunner.query(`ALTER TABLE \`questions\` ADD \`options\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`time_limit\` \`time_limit\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`questions\` CHANGE \`fun_fact\` \`fun_fact\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`answers\` CHANGE \`is_correct\` \`is_correct\` tinyint NULL DEFAULT 'NULL'`);
        await queryRunner.query(`DROP INDEX \`IDX_dc8961dedb47a7f7aa68203534\` ON \`quiz_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_2f3005ad9fd7315dc2d515a57c\` ON \`quiz_sessions\``);
        await queryRunner.query(`DROP TABLE \`quiz_sessions\``);
    }

}
