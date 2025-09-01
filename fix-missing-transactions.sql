-- Fix missing credit transactions by creating audit records
-- This finds users who have credits but missing corresponding transaction records

WITH user_credit_summary AS (
  SELECT 
    p.id as user_id,
    p.username,
    p.credits as current_credits,
    COALESCE(SUM(ct.amount), 0) as transaction_sum,
    (p.credits - COALESCE(SUM(ct.amount), 0)) as missing_credits
  FROM user_profiles p 
  LEFT JOIN credit_transactions ct ON p.id = ct.user_id 
  WHERE p.credits > 0
  GROUP BY p.id, p.username, p.credits
  HAVING (p.credits - COALESCE(SUM(ct.amount), 0)) != 0
)
INSERT INTO credit_transactions (user_id, amount, transaction_type, admin_notes)
SELECT 
  user_id,
  missing_credits,
  'adjustment',
  'Data fix: Added missing transaction record for existing credits (automated)'
FROM user_credit_summary
WHERE missing_credits > 0;

-- Show the results
SELECT 
  p.username,
  p.credits,
  COUNT(ct.id) as transaction_count,
  COALESCE(SUM(ct.amount), 0) as transaction_sum
FROM user_profiles p 
LEFT JOIN credit_transactions ct ON p.id = ct.user_id 
WHERE p.credits > 0
GROUP BY p.id, p.username, p.credits
ORDER BY p.username;