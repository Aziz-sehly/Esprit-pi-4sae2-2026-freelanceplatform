ALTER TABLE IF EXISTS milestone
DROP CONSTRAINT IF EXISTS milestone_status_check;

ALTER TABLE IF EXISTS milestone
ADD CONSTRAINT milestone_status_check
CHECK (status IN (
    'PENDING',
    'SUBMITTED',
    'REVISION_REQUESTED',
    'APPROVED',
    'FUNDED',
    'OVERDUE',
    'PAID'
));
