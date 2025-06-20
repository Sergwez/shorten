import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('urls', (table) => {
    table.string('id').primary();
    table.text('original_url').notNullable();
    table.string('short_url').notNullable().unique();
    table.string('alias').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('expires_at').nullable();
    table.integer('click_count').defaultTo(0).notNullable();
    
    // Индексы для быстрого поиска
    table.index('short_url');
    table.index('alias');
    table.index('created_at');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('urls');
}

