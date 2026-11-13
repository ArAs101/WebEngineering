DROP INDEX "comments_bear_id_idx";--> statement-breakpoint
CREATE INDEX "comments_bear_created_idx" ON "comments" USING btree ("bear_id","created_at","id");