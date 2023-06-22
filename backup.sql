PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "accounts" (account_id CHAR PRIMARY KEY, disabled INTEGER);
INSERT INTO accounts VALUES('-1',0);

CREATE TABLE IF NOT EXISTS "transactions" (time_stamp CHAR PRIMARY KEY, amount INTEGER, name CHAR, agent CHAR, receiver CHAR, authorizer CHAR, is_automated INTEGER, FOREIGN KEY (agent) REFERENCES accounts (account_id), FOREIGN KEY (receiver) REFERENCES accounts (account_id), FOREIGN KEY (authorizer) REFERENCES accounts (account_id));

 -- The government originally has 100000
INSERT INTO transactions VALUES('-1',100000,'DCP','0','-1','-1',0);

CREATE TABLE IF NOT EXISTS "schedules" (minimum_time_stamp CHAR, maximum_time_stamp CHAR, cycle_length CHAR, current_x INTEGER, last_updated CHAR, amount CHAR, name CHAR, agent CHAR, receiver CHAR, authorizer CHAR, reason CHAR, PRIMARY KEY (minimum_time_stamp, maximum_time_stamp, cycle_length), FOREIGN KEY (agent) REFERENCES accounts (account_id), FOREIGN KEY (receiver) REFERENCES accounts (account_id), FOREIGN KEY (authorizer) REFERENCES accounts (account_id));

CREATE TABLE IF NOT EXISTS "stocks" (time_stamp CHAR PRIMARY KEY, name CHAR, price CHAR);
COMMIT;
