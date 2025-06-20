import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('clicks', (table) => {
    table.increments('id').primary();
    table.string('url_id').notNullable();
    table.string('ip_address', 45).notNullable();
    table.timestamp('clicked_at').defaultTo(knex.fn.now()).notNullable();
    
    // Внешний ключ к таблице urls
    table.foreign('url_id').references('id').inTable('urls').onDelete('CASCADE');
    
    // Индексы для быстрого поиска
    table.index('url_id');
    table.index('clicked_at');
    table.index(['url_id', 'clicked_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('clicks');
} 