-- Create function to update account balance from transaction
CREATE OR REPLACE FUNCTION update_account_balance_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the account's available_balance to match the transaction's balance
  UPDATE accounts
  SET 
    available_balance = NEW.balance,
    updated_at = now()
  WHERE id = NEW.account_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after INSERT or UPDATE on transactions
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OF balance, account_id
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_from_transaction();