PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "accounts" (account_id CHAR PRIMARY KEY, disabled INTEGER);
INSERT INTO accounts VALUES('-1',0);

CREATE TABLE IF NOT EXISTS "transactions" (time_stamp CHAR PRIMARY KEY, amount INTEGER, name CHAR, agent CHAR, receiver CHAR, authorizer CHAR, FOREIGN KEY (agent) REFERENCES accounts (account_id), FOREIGN KEY (receiver) REFERENCES accounts (account_id));

 -- The government originally has 100000
INSERT INTO transactions VALUES('-1',100000,'DCP','0','-1','-1');

CREATE TABLE IF NOT EXISTS "schedules" (first_transaction_time_stamp CHAR PRIMARY KEY, last_transaction_time_stamp CHAR, interval_time_stamp CHAR, amount INTEGER, name CHAR, agent CHAR, receiver CHAR, authorizer CHAR, FOREIGN KEY (agent) REFERENCES accounts (account_id), FOREIGN KEY (receiver) REFERENCES accounts (account_id), FOREIGN KEY (authorizer) REFERENCES accounts (account_id));
COMMIT;
