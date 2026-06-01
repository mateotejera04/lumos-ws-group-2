COBC    ?= cobc
COBFLAGS = -x -Wall -I copy
SRC      = src/banking.cbl
BIN      = banking

.PHONY: all run clean reset

all: $(BIN)

$(BIN): $(SRC) copy/account.cpy copy/transaction.cpy copy/control.cpy
	$(COBC) $(COBFLAGS) -o $(BIN) $(SRC)

run: $(BIN)
	@mkdir -p data
	./$(BIN)

clean:
	rm -f $(BIN)

reset: clean
	rm -f data/*.dat data/*.dat.*
