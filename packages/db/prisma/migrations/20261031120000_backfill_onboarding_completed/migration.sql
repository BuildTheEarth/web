-- Backfill: existing users who already have a Minecraft name set are treated as onboarded,
-- so the dashboard middleware does not redirect them to /welcome. Users without a Minecraft
-- name keep onboardingCompletedAt = NULL and still go through onboarding.
-- (User has no createdAt column, so NOW() is used.)
UPDATE "User"
SET "onboardingCompletedAt" = NOW()
WHERE "onboardingCompletedAt" IS NULL
  AND "minecraft" IS NOT NULL
  AND BTRIM("minecraft") <> '';
