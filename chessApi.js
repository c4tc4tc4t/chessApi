const { spawn } = require("child_process");
const path = require("path");
const stockfishPath = path.join(__dirname, '../chessApi/stockfish/stockfish-windows-x86-64.exe');
const stockfish = spawn(stockfishPath);

const express = require("express");
const app = express();

function formatArray(inputArray) {
    const filteredArray = inputArray.filter((item, index) => index % 2 !== 0);
    const formattedArray = filteredArray.map(item => item.replace("pv ", ""));
    return formattedArray;
  }


app.get("/", (req, res) => {
  const { fen } = req.query;
  stockfish.stdin.write("uci\n");
  // stockfish.stdin.write("ucinewgame\n");
  stockfish.stdin.write("setoption name MultiPV value 5\n");
  stockfish.stdin.write("position startpos\n");
  // stockfish.stdin.write("position startpos moves e2e4 e7e5\n");
  console.log({ fen });
  stockfish.stdin.write(`position fen ${fen}\n`);
  stockfish.stdin.write("go depth 24\n");

  stockfish.stdout.on("data", (data) => {
    if (data.includes("bestmove")) {
      console.log(`>> output: ${data} << \n\n`);

      const bestmoves = data
        .toString()
        .match(/pv (.+?)\s/g);
        
        const formatedBestMoves = formatArray(bestmoves)

      res.send({ bestmoves: formatedBestMoves });

      stockfish.stdin.write("quit\n");

      // KILL
    }
  });

  stockfish.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  stockfish.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

app.listen(3000, () => console.log("Chess API listening on port 3000"));



// GET: http://localhost:3000/?fen=4kbnr/p1pp3p/b5p1/1n6/K1P4P/P1P1PB2/3P2PP/N1BQ3R%20b%20k%20-%200%201