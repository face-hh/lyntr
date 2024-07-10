import { boolean, date, pgTable, serial, text, timestamp, varchar, integer, type AnyPgColumn, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';

export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    username: varchar('username', { length: 60 }).notNull(),
    handle: varchar('handle', { length: 32 }).notNull().unique(),
    created_at: timestamp('created_at').defaultNow(),
    iq: integer('iq').notNull(),
    profile_picture: text('profile_picture').default("default"),
    verified: boolean('verified').default(false)
});

export const lynts = pgTable('lynts', {
    id: uuid('id').primaryKey(),
    user_id: uuid('user_id').references(() => users.id),
    content: text('content').notNull(),
    views: integer('views').default(0),
    shares: integer('shares').default(0),
    has_link: boolean('has_link').default(false),
    created_at: timestamp('created_at').defaultNow(),
    // todo: if you want quotes, render content and parent id if reposted
    reposted: boolean('reposted').default(false),
    parent: uuid('parent').references((): AnyPgColumn => lynts.id)
});

export const followers = pgTable('followers', {
    user_id: uuid('user_id').references(() => users.id).notNull(),
    follower_id: uuid('follower_id').references(() => users.id).notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.follower_id], name: 'followers_pkey' }),  // Replace 'followers_pkey' with the actual constraint name from your database
    }
});

export const likes = pgTable('likes', {
    lynt_id: uuid('lynt_id').references(() => lynts.id).notNull(),
    user_id: uuid('user_id').references(() => users.id).notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.lynt_id, table.user_id], name: 'likes_pkey' }),  // Replace 'likes_pkey' with the actual constraint name from your database
    }
});

const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey(),
    user_id: uuid('user_id').references(() => users.id),
    content: text('content').notNull(),
    created_at: timestamp('created_at').defaultNow()
});

export const history = pgTable('history', {
    id: uuid('id').primaryKey(),
    user_id: uuid('user_id').references(() => users.id),
    lynt_id: uuid('lynt_id').references(() => lynts.id)
});