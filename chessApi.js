const { spawn } = require('child_process');
const path = require('path');
const stockfishPath = path.join(__dirname, '../chess-API/stockfish/stockfish-windows-x86-64.exe');
const stockfish = spawn(stockfishPath);



const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello, Chess World!');
});

stockfish.stdin.write('uci\n');
stockfish.stdin.write('ucinewgame\n');
stockfish.stdin.write('position startpos moves e2e4 e7e5\n');
stockfish.stdin.write('go depth 20\n');

stockfish.stdout.on('data', (data) => {
    console.log(`output: ${data}`);
});

stockfish.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

stockfish.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

app.listen(3000, () => console.log('Chess API listening on port 3000'));
