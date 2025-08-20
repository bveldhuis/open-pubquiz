import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventTypeEnum1755701600000 implements MigrationInterface {
    name = 'UpdateEventTypeEnum1755701600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, we need to modify the enum to include the new values
        // MySQL doesn't support adding values to an existing enum directly
        // So we need to recreate the column with the new enum values
        
        // Create a temporary column with the new enum values
        await queryRunner.query(`
            ALTER TABLE \`session_events\` 
            ADD COLUMN \`event_type_new\` ENUM(
                'session_created',
                'question_started', 
                'question_ended',
                'round_started',
                'round_ended',
                'session_ended',
                'start_question',
                'end_question',
                'show_leaderboard',
                'show_review',
                'next_round'
            ) NULL
        `);

        // Copy data from old column to new column, mapping the values
        await queryRunner.query(`
            UPDATE \`session_events\` 
            SET \`event_type_new\` = \`event_type\`
            WHERE \`event_type\` IN (
                'session_created',
                'question_started', 
                'question_ended',
                'round_started',
                'round_ended',
                'session_ended'
            )
        `);

        // Drop the old column
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_type\``);

        // Rename the new column to the original name
        await queryRunner.query(`ALTER TABLE \`session_events\` CHANGE \`event_type_new\` \`event_type\` ENUM(
            'session_created',
            'question_started', 
            'question_ended',
            'round_started',
            'round_ended',
            'session_ended',
            'start_question',
            'end_question',
            'show_leaderboard',
            'show_review',
            'next_round'
        ) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to the original enum values
        await queryRunner.query(`
            ALTER TABLE \`session_events\` 
            ADD COLUMN \`event_type_old\` ENUM(
                'session_created',
                'question_started', 
                'question_ended',
                'round_started',
                'round_ended',
                'session_ended'
            ) NULL
        `);

        // Copy data back, but only for the original enum values
        await queryRunner.query(`
            UPDATE \`session_events\` 
            SET \`event_type_old\` = \`event_type\`
            WHERE \`event_type\` IN (
                'session_created',
                'question_started', 
                'question_ended',
                'round_started',
                'round_ended',
                'session_ended'
            )
        `);

        // Drop the new column
        await queryRunner.query(`ALTER TABLE \`session_events\` DROP COLUMN \`event_type\``);

        // Rename the old column back
        await queryRunner.query(`ALTER TABLE \`session_events\` CHANGE \`event_type_old\` \`event_type\` ENUM(
            'session_created',
            'question_started', 
            'question_ended',
            'round_started',
            'round_ended',
            'session_ended'
        ) NOT NULL`);
    }
}
