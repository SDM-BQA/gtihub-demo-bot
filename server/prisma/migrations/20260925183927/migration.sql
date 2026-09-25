-- CreateEnum
CREATE TYPE "Trigger" AS ENUM ('ISSUE_OPENED', 'PR_OPENED', 'PUSH');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ADD_LABEL', 'COMMENT', 'SLACK', 'AI_SUMMARY');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "githubId" BIGINT NOT NULL,
    "login" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" SERIAL NOT NULL,
    "githubInstallationId" BIGINT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repo" (
    "id" SERIAL NOT NULL,
    "githubRepoId" BIGINT NOT NULL,
    "fullName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "installationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" SERIAL NOT NULL,
    "repoId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "Trigger" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "titleContains" TEXT,
    "author" TEXT,
    "hasLabel" TEXT,
    "addLabel" TEXT,
    "comment" TEXT,
    "notifySlack" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "githubEvent" TEXT NOT NULL,
    "action" TEXT,
    "repoId" INTEGER,
    "payload" JSONB NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "url" TEXT,
    "aiSummary" TEXT,
    "aiPriority" TEXT,
    "aiLabel" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "ruleId" INTEGER,
    "type" "ActionType" NOT NULL,
    "status" "ActionStatus" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "detail" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_githubInstallationId_key" ON "Installation"("githubInstallationId");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_githubRepoId_key" ON "Repo"("githubRepoId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_deliveryId_key" ON "Event"("deliveryId");

-- CreateIndex
CREATE INDEX "Event_status_nextAttemptAt_idx" ON "Event"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "Event_repoId_receivedAt_idx" ON "Event"("repoId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActionLog_eventId_ruleId_type_key" ON "ActionLog"("eventId", "ruleId", "type");

-- CreateIndex
CREATE INDEX "session_expire_idx" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repo" ADD CONSTRAINT "Repo_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
