const { spawn } = require("child_process");
const path = require("path");


const express = require("express");
const app = express();

const cors = require('cors');
app.use(cors());

// function formatArray(inputArray) {
//     const filteredArray = inputArray.filter((item, index) => index % 2 !== 0);
//     const formattedArray = filteredArray.map(item => item.replace("pv ", ""));
//     return formattedArray;
//   }


app.get("/", (req, res) => {
    const stockfishPath = path.join(__dirname, '../chessApi/stockfish/stockfish-windows-x86-64.exe');
    const stockfish = spawn(stockfishPath);
    const { fen } = req.query;
    stockfish.stdin.write("uci\n");
    stockfish.stdin.write("setoption name MultiPV value 5\n");
    stockfish.stdin.write("position startpos\n");
    console.log({ fen });
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write("go depth 10\n");

    let responseData = null;

    stockfish.stdout.on("data", (data) => {
        if (data.includes("score")) {
            console.log(`>> output: ${data} << \n\n`);

            const regexPattern = /multipv (\d+) score cp (-?\d+) .*?pv ([a-h][1-8][a-h][1-8])/g;
            let match;
            const bestMoves = [];
            while ((match = regexPattern.exec(data.toString())) !== null) {
                const [_, multipv, score, move] = match;
                bestMoves.push({
                    move,
                    score: parseInt(score, 10)
                });
            }

            responseData = { bestmoves: bestMoves };

            stockfish.stdin.write("quit\n");
        } else {
            const regexBestMove = /bestmove (\S+)/;
            const match = regexBestMove.exec(data.toString());
            if (match) {
                const bestMove = {
                    move: match[1],
                    score: ''
                };

                responseData = { bestmoves: [bestMove] };
            }
        }
    });

    stockfish.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });

    stockfish.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        res.send(responseData);
    });
});

app.listen(3000, () => console.log("Chess API listening on port 3000"));
