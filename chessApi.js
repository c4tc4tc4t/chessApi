// const { spawn } = require("child_process");
// const path = require("path");


// const express = require("express");
// const app = express();

// const cors = require('cors');
// app.use(cors());

// // function formatArray(inputArray) {
// //     const filteredArray = inputArray.filter((item, index) => index % 2 !== 0);
// //     const formattedArray = filteredArray.map(item => item.replace("pv ", ""));
// //     return formattedArray;
// //   }


// app.get("/", (req, res) => {
//     const stockfishPath = path.join(__dirname, '../chessApi/stockfish/stockfish-windows-x86-64.exe');
//     const stockfish = spawn(stockfishPath);
//     const { fen } = req.query;
//     stockfish.stdin.write("uci\n");
//     stockfish.stdin.write("setoption name MultiPV value 5\n");
//     stockfish.stdin.write("position startpos\n");
//     console.log({ fen });
//     stockfish.stdin.write(`position fen ${fen}\n`);
//     stockfish.stdin.write("go depth 10\n");

//     let responseData = null;

//     stockfish.stdout.on("data", (data) => {
//         if (data.includes("score")) {
//             console.log(`>> output: ${data} << \n\n`);

//             const regexPattern = /multipv (\d+) score cp (-?\d+) .*?pv ([a-h][1-8][a-h][1-8])/g;
//             let match;
//             const bestMoves = [];
//             while ((match = regexPattern.exec(data.toString())) !== null) {
//                 const [_, multipv, score, move] = match;
//                 bestMoves.push({
//                     move,
//                     score: parseInt(score, 10)
//                 });
//             }

//             responseData = { bestmoves: bestMoves };

//             stockfish.stdin.write("quit\n");
//         } else {
//             const regexBestMove = /bestmove (\S+)/;
//             const match = regexBestMove.exec(data.toString());
//             if (match) {
//                 const bestMove = {
//                     move: match[1],
//                     score: ''
//                 };

//                 responseData = { bestmoves: [bestMove] };
//             }
//         }
//     });

//     stockfish.stderr.on("data", (data) => {
//         console.error(`stderr: ${data}`);
//     });

//     stockfish.on("close", (code) => {
//         console.log(`child process exited with code ${code}`);
//         res.send(responseData);
//     });
// });

// app.listen(3000, () => console.log("Chess API listening on port 3000"));

const { spawn } = require("child_process");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    const stockfishPath = path.join(__dirname, '../chessApi/stockfish/stockfish-windows-x86-64.exe');
    const stockfish = spawn(stockfishPath);
    const { fen } = req.query;

    stockfish.stdin.write("uci\n");
    stockfish.stdin.write("setoption name MultiPV value 5\n");
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write("go depth 10\n");

    let bestMoves = [];
    let responseSent = false; // Evita múltiplas respostas

    stockfish.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`>> output: ${output} << \n\n`);

        // Regex atualizado para capturar múltiplas jogadas
        const regexPattern = /multipv (\d+) score (cp|mate) (-?\d+) .*?pv ((?:[a-h][1-8]){2}[qrbn]?)/g;
        let match;

        while ((match = regexPattern.exec(output)) !== null) {
            const [, multipv, scoreType, score, move] = match;
            bestMoves.push({
                move,
                score: scoreType === "mate" ? `mate ${score}` : parseInt(score, 10)
            });
        }

        // Captura "bestmove" apenas se ainda não tivermos múltiplos melhores lances
        if (bestMoves.length === 0) {
            const regexBestMove = /bestmove (\S+)/;
            const match = regexBestMove.exec(output);
            if (match) {
                bestMoves.push({ move: match[1], score: "" });
            }
        }

        // Enviar resposta apenas uma vez
        if (!responseSent && bestMoves.length > 0) {
            responseSent = true;
            res.json({ bestmoves: bestMoves });
            stockfish.stdin.write("quit\n"); // Finaliza o Stockfish
        }
    });

    stockfish.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });

    stockfish.on("close", (code) => {
        console.log(`child process exited with code ${code}`);

        // Caso a resposta ainda não tenha sido enviada, enviar uma resposta padrão
        if (!responseSent) {
            res.json({ bestmoves: bestMoves.length ? bestMoves : [{ move: "No move found", score: "" }] });
        }
    });
});

app.listen(3000, () => console.log("Chess API listening on port 3000"));

