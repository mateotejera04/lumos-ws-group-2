       IDENTIFICATION DIVISION.
       PROGRAM-ID. BANKING.
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACTFL ASSIGN TO "data/accounts.dat"
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS AR-NO
               FILE STATUS IS W-S1.
           SELECT TRNFL ASSIGN TO "data/transactions.dat"
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS TR-ID
               ALTERNATE RECORD KEY IS TR-AC WITH DUPLICATES
               FILE STATUS IS W-S2.
           SELECT CTLFL ASSIGN TO "data/control.dat"
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS CT-K
               FILE STATUS IS W-S3.
       DATA DIVISION.
       FILE SECTION.
       FD  ACTFL.
       COPY "account.cpy".
       FD  TRNFL.
       COPY "transaction.cpy".
       FD  CTLFL.
       COPY "control.cpy".
       WORKING-STORAGE SECTION.
       01  WK1.
           05  W-S1    PIC XX.
           05  W-S2    PIC XX.
           05  W-S3    PIC XX.
       01  WK2.
           05  W-D0    PIC X    VALUE "N".
               88  W-DN    VALUE "Y".
           05  W-F0    PIC X    VALUE "N".
               88  W-FY    VALUE "Y".
               88  W-FN    VALUE "N".
       01  WK3.
           05  W-CH    PIC X.
           05  W-IL    PIC X(40).
           05  W-A1    PIC 9(8).
           05  W-A2    PIC 9(8).
           05  W-AM    PIC S9(13)V99 COMP-3.
           05  W-HN    PIC X(30).
       01  WK4.
           05  W-TG    PIC 9(8).
           05  W-K1    PIC 9(6).
           05  W-K2    PIC 9(6).
           05  W-CD    PIC X(21).
           05  W-NT    PIC 9(14).
           05  W-ND    PIC 9(8).
           05  W-IX    PIC 9(2).
       01  WK5.
           05  W-ME    PIC -Z,ZZZ,ZZZ,ZZ9.99.
           05  W-DE.
               10  W-EY    PIC 9(4).
               10  FILLER  PIC X    VALUE "-".
               10  W-EM    PIC 9(2).
               10  FILLER  PIC X    VALUE "-".
               10  W-EX    PIC 9(2).
       01  WK6.
           05  W-OLD-BAL   PIC S9(13)V99 COMP-3.
           05  W-SAVE-NO   PIC 9(8).
           05  W-INT-RATE  PIC 9V9(4)   VALUE 0.0150.
           05  W-CNT       PIC 9(6)     VALUE 0.
           05  W-PROC-SW   PIC X        VALUE "N".
               88  W-PROC-OK   VALUE "Y".
           05  FILLER      PIC X(10)    VALUE "RESERVED".
           05  W-RC        PIC 9(4)     VALUE 0.
       01  WK7.
           05  W-DTE-OLD.
               10  W-OY    PIC 9(2).
               10  W-OM    PIC 9(2).
               10  W-OD    PIC 9(2).
       PROCEDURE DIVISION.
       A0 SECTION.
       A1.
           PERFORM B0
           PERFORM C0 UNTIL W-DN
           PERFORM Y0
           STOP RUN.
       B0 SECTION.
       B1.
           DISPLAY " "
           DISPLAY "==================================================="
           DISPLAY "        COBOL BANKING DEMO  -  v1.0"
           DISPLAY "==================================================="
           OPEN I-O ACTFL
           IF W-S1 = "35"
               OPEN OUTPUT ACTFL
               CLOSE ACTFL
               OPEN I-O ACTFL
           END-IF
           PERFORM B2
           OPEN I-O TRNFL
           IF W-S2 = "35"
               OPEN OUTPUT TRNFL
               CLOSE TRNFL
               OPEN I-O TRNFL
           END-IF
           IF W-S2 NOT = "00"
               DISPLAY "FATAL: cannot open transaction file, status "
                   W-S2
               STOP RUN
           END-IF
           OPEN I-O CTLFL
           IF W-S3 = "35"
               OPEN OUTPUT CTLFL
               CLOSE CTLFL
               OPEN I-O CTLFL
           END-IF
           IF W-S3 NOT = "00"
               DISPLAY "FATAL: cannot open control file, status " W-S3
               STOP RUN
           END-IF
           PERFORM B3.
       B2.
           IF W-S1 NOT = "00"
               DISPLAY "FATAL: cannot open account file, status " W-S1
               STOP RUN
           END-IF.
       B3.
           MOVE 1 TO CT-K
           READ CTLFL
               INVALID KEY
                   MOVE 1 TO CT-K
                   MOVE 10000001 TO CT-NA
                   MOVE 1 TO CT-NT
                   WRITE CREC
           END-READ.
       C0 SECTION.
       C1.
           DISPLAY " "
           DISPLAY "---------------------------------------------------"
           DISPLAY " 1) Open account        2) Deposit"
           DISPLAY " 3) Withdraw            4) Transfer"
           DISPLAY " 5) View account        6) Transaction history"
           DISPLAY " 7) List all accounts    8) Close account"
           DISPLAY " 0) Exit"
           DISPLAY "---------------------------------------------------"
           DISPLAY "Choice: " WITH NO ADVANCING
           ACCEPT W-CH
           MOVE 99 TO W-IX
           IF W-CH >= "0" AND W-CH <= "8"
               COMPUTE W-IX = FUNCTION NUMVAL(W-CH) + 1
           END-IF
           GO TO
               C-QIT C-OPN C-DEP C-WDR C-XFR C-VIE C-HIS C-LST C-CLS
               DEPENDING ON W-IX
           DISPLAY "Invalid choice, try again."
           GO TO C-EXT.
       C-QIT.
           MOVE "Y" TO W-D0
           GO TO C-EXT.
       C-OPN.
           PERFORM D0
           GO TO C-EXT.
       C-DEP.
           PERFORM E0
           GO TO C-EXT.
       C-WDR.
           PERFORM F0
           GO TO C-EXT.
       C-XFR.
           PERFORM G0
           GO TO C-EXT.
       C-VIE.
           PERFORM H0
           GO TO C-EXT.
       C-HIS.
           PERFORM I0
           GO TO C-EXT.
       C-LST.
           PERFORM J0
           GO TO C-EXT.
       C-CLS.
           PERFORM K0
           GO TO C-EXT.
       C-EXT.
           EXIT.
       D0 SECTION.
       D1.
           DISPLAY " "
           DISPLAY "-- Open new account --"
           DISPLAY "Account holder name: " WITH NO ADVANCING
           ACCEPT W-HN
           IF W-HN = SPACES
               DISPLAY "Name cannot be blank. Cancelled."
               GO TO D9
           END-IF
           PERFORM Z2
           PERFORM Z4
           MOVE W-A1 TO AR-NO
           MOVE W-HN TO AR-NM
           MOVE 0 TO AR-BAL
           SET AR-A TO TRUE
           MOVE W-ND TO AR-DT
           WRITE AREC
           IF W-S1 = "00"
               DISPLAY "Account opened. Number: " AR-NO
           ELSE
               DISPLAY "Could not create account, status " W-S1
           END-IF.
       D9.
           EXIT.
       E0 SECTION.
       E1.
           DISPLAY " "
           DISPLAY "-- Deposit --"
           PERFORM Z6
           PERFORM Z5
           IF W-FN
               GO TO E9
           END-IF
           IF AR-C
               DISPLAY "Account is closed."
               GO TO E9
           END-IF
           PERFORM Z7
           IF W-AM <= 0
               DISPLAY "Amount must be positive. Cancelled."
               GO TO E9
           END-IF
           ADD W-AM TO AR-BAL
           REWRITE AREC
           MOVE "DEP" TO TR-TY
           MOVE 0 TO TR-CP
           PERFORM Z1
           MOVE AR-BAL TO W-ME
           DISPLAY "Deposit posted. New balance: " W-ME.
       E9.
           EXIT.
       F0 SECTION.
       F1.
           DISPLAY " "
           DISPLAY "-- Withdraw --"
           PERFORM Z6
           PERFORM Z5
           IF W-FN
               GO TO F9
           END-IF
           IF AR-C
               DISPLAY "Account is closed."
               GO TO F9
           END-IF
           PERFORM Z7
           IF W-AM <= 0
               DISPLAY "Amount must be positive. Cancelled."
               GO TO F9
           END-IF
           IF W-AM > AR-BAL
               MOVE AR-BAL TO W-ME
               DISPLAY "Insufficient funds. Balance is " W-ME
               GO TO F9
           END-IF
           SUBTRACT W-AM FROM AR-BAL
           REWRITE AREC
           MOVE "WDR" TO TR-TY
           MOVE 0 TO TR-CP
           PERFORM Z1
           MOVE AR-BAL TO W-ME
           DISPLAY "Withdrawal posted. New balance: " W-ME.
       F9.
           EXIT.
       G0 SECTION.
       G1.
           DISPLAY " "
           DISPLAY "-- Transfer --"
           DISPLAY "From account: " WITH NO ADVANCING
           ACCEPT W-IL
           COMPUTE W-A1 = FUNCTION NUMVAL(W-IL)
           DISPLAY "To account:   " WITH NO ADVANCING
           ACCEPT W-IL
           COMPUTE W-A2 = FUNCTION NUMVAL(W-IL)
           IF W-A1 = W-A2
               DISPLAY "Cannot transfer to the same account."
               GO TO G9
           END-IF
           MOVE W-A1 TO AR-NO
           READ ACTFL
               INVALID KEY
                   DISPLAY "Source account not found."
                   GO TO G9
           END-READ
           IF AR-C
               DISPLAY "Source account is closed."
               GO TO G9
           END-IF
           PERFORM Z7
           IF W-AM <= 0
               DISPLAY "Amount must be positive. Cancelled."
               GO TO G9
           END-IF
           IF W-AM > AR-BAL
               MOVE AR-BAL TO W-ME
               DISPLAY "Insufficient funds. Balance is " W-ME
               GO TO G9
           END-IF
           MOVE W-A2 TO AR-NO
           READ ACTFL
               INVALID KEY
                   DISPLAY "Destination account not found. Cancelled."
                   GO TO G9
           END-READ
           IF AR-C
               DISPLAY "Destination account is closed. Cancelled."
               GO TO G9
           END-IF
           MOVE W-A1 TO AR-NO
           READ ACTFL
           SUBTRACT W-AM FROM AR-BAL
           REWRITE AREC
           MOVE "TOU" TO TR-TY
           MOVE W-A2 TO TR-CP
           PERFORM Z1
           MOVE W-A2 TO AR-NO
           READ ACTFL
           ADD W-AM TO AR-BAL
           REWRITE AREC
           MOVE "TIN" TO TR-TY
           MOVE W-A1 TO TR-CP
           PERFORM Z1
           MOVE W-AM TO W-ME
           DISPLAY "Transferred " W-ME " from " W-A1 " to " W-A2.
       G9.
           EXIT.
       H0 SECTION.
       H1.
           DISPLAY " "
           DISPLAY "-- View account --"
           PERFORM Z6
           PERFORM Z5
           IF W-FN
               GO TO H9
           END-IF
           PERFORM Z8.
       H9.
           EXIT.
       I0 SECTION.
       I1.
           DISPLAY " "
           DISPLAY "-- Transaction history --"
           PERFORM Z6
           MOVE W-A1 TO W-TG
           MOVE 0 TO W-K1
           MOVE W-TG TO TR-AC
           START TRNFL KEY IS >= TR-AC
               INVALID KEY
                   CONTINUE
           END-START
           IF W-S2 NOT = "00"
               DISPLAY "No transactions for this account."
               GO TO I9
           END-IF
           DISPLAY "  TXN-ID      TYPE  AMOUNT             BAL-AFTER"
           DISPLAY "  ----------- ----- ------------------ -----------"
           PERFORM Z9
           PERFORM UNTIL W-S2 NOT = "00"
                      OR TR-AC NOT = W-TG
               ADD 1 TO W-K1
               PERFORM ZA
               PERFORM Z9
           END-PERFORM
           IF W-K1 = 0
               DISPLAY "No transactions for this account."
           ELSE
               DISPLAY "  (" W-K1 " transaction(s))"
           END-IF.
       I9.
           EXIT.
       J0 SECTION.
       J1.
           DISPLAY " "
           DISPLAY "-- All accounts --"
           MOVE 0 TO W-K2
           MOVE 0 TO AR-NO
           START ACTFL KEY IS >= AR-NO
               INVALID KEY
                   CONTINUE
           END-START
           IF W-S1 NOT = "00"
               DISPLAY "No accounts on file."
               GO TO J9
           END-IF
           DISPLAY "  ACCT-ID   ST  HOLDER" SPACE
               "                  BALANCE"
           DISPLAY "  --------- --  ------------------------------ "
               "--------------"
           PERFORM ZB.
       J-LP.
           IF W-S1 NOT = "00"
               GO TO J-DN
           END-IF
           ADD 1 TO W-K2
           MOVE AR-BAL TO W-ME
           DISPLAY "  " AR-NO "  " AR-ST "  " AR-NM " " W-ME
           PERFORM ZB
           GO TO J-LP.
       J-DN.
           DISPLAY "  (" W-K2 " account(s))".
       J9.
           EXIT.
       K0 SECTION.
       K1.
           DISPLAY " "
           DISPLAY "-- Close account --"
           PERFORM Z6
           PERFORM Z5
           IF W-FN
               GO TO K9
           END-IF
           IF AR-C
               DISPLAY "Account is already closed."
               GO TO K9
           END-IF
           IF AR-BAL NOT = 0
               MOVE AR-BAL TO W-ME
               DISPLAY "Balance must be zero to close. Balance: " W-ME
               GO TO K9
           END-IF
           SET AR-C TO TRUE
           REWRITE AREC
           DISPLAY "Account " AR-NO " closed.".
       K9.
           EXIT.
       Z0 SECTION.
       Z1.
           PERFORM Z3
           PERFORM Z4
           MOVE AR-NO TO TR-AC
           MOVE W-AM TO TR-AM
           MOVE AR-BAL TO TR-BA
           MOVE W-NT TO TR-TS
           WRITE TREC
           IF W-S2 NOT = "00"
               DISPLAY "WARNING: txn log write failed, status " W-S2
           END-IF
           MOVE "Y" TO W-PROC-SW
           ADD 1 TO W-CNT.
       Z2.
           MOVE 1 TO CT-K
           READ CTLFL
           MOVE CT-NA TO W-A1
           ADD 1 TO CT-NA
           REWRITE CREC.
       Z3.
           MOVE 1 TO CT-K
           READ CTLFL
           MOVE CT-NT TO TR-ID
           ADD 1 TO CT-NT
           REWRITE CREC.
       Z4.
           MOVE FUNCTION CURRENT-DATE TO W-CD
           MOVE W-CD(1:14) TO W-NT
           MOVE W-CD(1:8) TO W-ND.
       Z5.
           MOVE W-A1 TO AR-NO
           READ ACTFL
               INVALID KEY
                   SET W-FN TO TRUE
                   DISPLAY "Account " W-A1 " not found."
               NOT INVALID KEY
                   SET W-FY TO TRUE
           END-READ.
       Z6.
           DISPLAY "Account number: " WITH NO ADVANCING
           ACCEPT W-IL
           COMPUTE W-A1 = FUNCTION NUMVAL(W-IL).
       Z7.
           DISPLAY "Amount: " WITH NO ADVANCING
           ACCEPT W-IL
           COMPUTE W-AM = FUNCTION NUMVAL(W-IL).
       Z8.
           MOVE AR-BAL TO W-ME
           MOVE AR-DT(1:4) TO W-EY
           MOVE AR-DT(5:2) TO W-EM
           MOVE AR-DT(7:2) TO W-EX
           DISPLAY " "
           DISPLAY "  Account : " AR-NO
           DISPLAY "  Holder  : " AR-NM
           DISPLAY "  Status  : " AR-ST
           DISPLAY "  Opened  : " W-DE
           DISPLAY "  Balance : " W-ME.
       Z9.
           READ TRNFL NEXT
               AT END
                   MOVE "10" TO W-S2
           END-READ.
       ZA.
           MOVE TR-AM TO W-ME
           DISPLAY "  " TR-ID " " TR-TY "   " W-ME WITH NO ADVANCING
           MOVE TR-BA TO W-ME
           DISPLAY "  " W-ME.
       ZB.
           READ ACTFL NEXT
               AT END
                   MOVE "10" TO W-S1
           END-READ.
       Y0 SECTION.
       Y1.
           CLOSE ACTFL TRNFL CTLFL
           DISPLAY " "
           DISPLAY "Goodbye."
           DISPLAY " ".
       X0 SECTION.
       X1.
           MOVE AR-BAL TO W-OLD-BAL
           MOVE AR-NO TO W-SAVE-NO
           IF AR-BAL <= 0
               GO TO X9
           END-IF
           COMPUTE AR-BAL = AR-BAL + (AR-BAL * W-INT-RATE)
           REWRITE AREC
           ADD 1 TO W-CNT
           MOVE 0 TO W-RC
           GO TO X9.
       X2.
           DISPLAY "RECALC ABORTED"
           MOVE 16 TO W-RC.
       X3.
           MOVE AR-DT(3:2) TO W-OY
           MOVE AR-DT(5:2) TO W-OM
           MOVE AR-DT(7:2) TO W-OD
           GO TO X9.
       X9.
           EXIT.
