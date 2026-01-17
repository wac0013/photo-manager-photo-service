-- CreateTable
CREATE TABLE "albums" (
    "id" VARCHAR(26) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(36),

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" VARCHAR(26) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "aquired_at" TIMESTAMP(3),
    "metadata" JSONB,
    "album_id" VARCHAR(26) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(36),

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_photo_album_id" ON "photos"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "photos_url_key" ON "photos"("url");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
