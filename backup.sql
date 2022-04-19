PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "accounts" (account_id CHAR PRIMARY KEY, disabled INTEGER);
INSERT INTO accounts VALUES('-1',0);

CREATE TABLE IF NOT EXISTS "transactions" (time_stamp CHAR PRIMARY KEY, amount INTEGER, name CHAR, agent CHAR, receiver CHAR, authorizer CHAR, FOREIGN KEY (agent) REFERENCES accounts (account_id), FOREIGN KEY (receiver) REFERENCES accounts (account_id));

 -- The government originally has 100000
INSERT INTO transactions VALUES('-1',100000,'$D','0','-1','-1');

CREATE TABLE IF NOT EXISTS "contracts" (time_stamp CHAR, name CHAR PRIMARY KEY, author CHAR, raw_source_code TEXT, FOREIGN KEY (author) REFERENCES accounts (account_id));
CREATE TABLE IF NOT EXISTS "signed_contracts" (time_stamp CHAR PRIMARY KEY, contract_time_stamp CHAR, FOREIGN KEY (contract_time_stamp) REFERENCES contracts (time_stamp));
CREATE TABLE IF NOT EXISTS "signed_as" (time_stamp CHAR PRIMARY KEY, sign_time_stamp CHAR, person CHAR, role CHAR, FOREIGN KEY (sign_time_stamp) REFERENCES signed_contracts (time_stamp));
COMMIT;
