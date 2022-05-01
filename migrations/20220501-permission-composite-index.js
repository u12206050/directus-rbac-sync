module.exports = {
    async up(knex) {
        await knex.schema.table('directus_permissions', (table) => {
            table.unique(['role', 'collection', 'action']);
        });
    },

    async down(knex) {
        await knex.schema.table('directus_permissions', (table) => {
            table.dropUnique(['role', 'collection', 'action']);
        });
    },
};