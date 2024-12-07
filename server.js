const express = require('express');
const expressWs = require('express-ws');
const mysql = require('mysql');
require('dotenv').config();
const { Timer } = require('./timer.js');

const app = express();
const PORT = process.env.PORT || 3000;
expressWs(app);

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    console.log('Got request from '+ req.socket.remoteAddress + " at url " + req.url)
    next();
});

const databaseOptions = {
    connectionLimit: 1000,
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: "chess"
}
app.post('/login', (req, res) => {
    console.log(req.body)
    if (!req.body.user || !req.body.pass) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Username or password not provided');
        console.log('Returned: Username or password not provided')
        return;
    }

    const db = mysql.createConnection(databaseOptions);
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
            console.log('Returned: Internal Server Error')
            db.end()
            return;
        }

        db.query(`SELECT * FROM users WHERE username = '${req.body.user}'`, (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                console.log('Returned: Internal Server Error')
                db.end()
                return;
            }

            if (result.length === 0 || result[0].password !== req.body.pass) {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Incorrect Username or Password');
                console.log('Returned: Incorrect Username or Password')
                db.end(); // Close connection after handling the query
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result[0]));
            console.log('Returned: ' + JSON.stringify(result[0]))
            db.end(); // Close connection after handling the query
        });
    });
})

app.post('/create', (req, res) => {

    if (!req.body.user || !req.body.pass) {
        if (!req.body.email){
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Username or password not provided');
            console.log('Returned: Username or password not provided')
            return;
        }
    }

    const db = mysql.createConnection(databaseOptions);
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
            console.log('Returned: Internal Server Error')
            db.end()
            return;
        }

        db.query(`SELECT * FROM users WHERE username = '${req.body.user}'`, (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                console.log('Returned: Internal Server Error')
                db.end()
                return;
            }

            if (result.length != 0) {
                res.writeHead(409, { 'Content-Type': 'text/plain' });
                res.end('Username already exists');
                console.log('Returned: Username already exists')
                db.end(); // Close connection after handling the query
                return;
            }

            db.query(`INSERT INTO users (username, password, rating) VALUES ('${req.body.user}', '${req.body.pass}', 1200)`, (err) => {
                if (err) {
                    console.error('Error executing query:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal server error');
                    console.log('Returned: Internal Server Error')
                    db.end()
                    return;
                }

                if (req.body.email){
                    db.query('INSERT INTO googleUsers (username, email) VALUES (?, ?)', [req.body.user, req.body.email], (err) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal server error');
                            console.log('Returned: Internal Server Error')
                            db.end()
                            return;
                        }
                    });
                }   
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Account created successfully');
                console.log('Returned: Account created successfully')
                db.end(); // Close connection after handling the query
            });
        });
    });
});

app.post('/googleSignIn', (req, res) => {
    console.log(req.body)
    if (!req.body.email) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Email not provided');
        console.log('Returned: Email not provided')
        return;
    }

    const db = mysql.createConnection(databaseOptions);
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
            console.log('Returned: Internal Server Error')
            db.end()
            return;
        }

        db.query(`SELECT * FROM googleUsers WHERE email = '${req.body.email}'`, (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                console.log('Returned: Internal Server Error')
                db.end()
                return;
            }

            if (result.length === 0) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Account needs to be created');
                console.log('Returned: Account needs to be created')
                db.end(); // Close connection after handling the query
                return;
            }

            db.query(`SELECT * FROM users WHERE username = '${result[0].username}'`, (err, result) => {
                if (err) {
                    console.error('Error executing query:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal server error');
                    console.log('Returned: Internal Server Error')
                    db.end()
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result[0]));
                console.log('Returned: ' + JSON.stringify(result[0]))
                db.end(); 
            });
        });
    });
});

app.post('/delete', (req, res) => {
    let data = req.body;
    console.log(data);
    if (!data.u){
        res.end('Username to delete not provided')
        return
    }
    let db = mysql.createConnection(databaseOptions)
    db.connect((err) => {
        if (err){console.log(err); db.end(); return;}
        db.query(`DELETE FROM users WHERE username = '${data.u}'`, (er, result) => {
            if (er) {console.log(er)}
            console.log(result)
            if (result.affectedRows){
                res.end('Username deleted successfully')
            }else {
                res.end('Data not found')
            }
            db.end()
        })
        
    })
});

app.get('/all',  (req, res) => {
    let db = mysql.createConnection(databaseOptions)
    db.connect((err) => {
        if (err) {console.log(err); db.end(); return;}
        db.query("SELECT * FROM users", (error, result) => {
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.end(JSON.stringify(result))
            db.end()
        })
    })
});

app.get('/games', (req, res) => {
    let db = mysql.createConnection(databaseOptions)
    let q = `SELECT * FROM games WHERE white = '${req.query.username}' OR black = '${req.query.username}' ORDER BY time DESC;`
    if (req.query.username == undefined){
        q = `SELECT * FROM games ORDER BY time DESC;`
    }
   
    db.connect((e) => {
        if (e){console.log(e); db.end(); return;}
        db.query(q, (err, result) => {
            if (err){console.log(err) ; db.end(); return;}
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(result))
            db.end()
        })
    })
});

app.get('/history', (req, res) => {
    let db = mysql.createConnection(databaseOptions)
    let sql = `SELECT * FROM rating_history WHERE user = '${req.query.username}' ORDER BY time;`
   
    db.connect((e) => {
        if (e){console.log(e) ; db.end(); return;}
        db.query(sql, (err, result) => {
            if (err){console.log(err)}
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(result))
            db.end()
        })
    })
})

app.get('/', (req, res) => {
    let query = req.query
    if (Object.keys(query).length > 0){
        if (!query.username){
            if (!query.email){
                res.end('Username not provided');
            }else{
                let db = mysql.createConnection(databaseOptions)
                db.connect((err) => {
                    if (err){console.log(err); db.end(); return;}
                    db.query(`SELECT * FROM googleUsers WHERE email = '${query.email}'`, (error, result) => {
                        if (error){console.log(error); db.end(); return;}
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(result))
                        console.log('Returned: ' + JSON.stringify(result))
                        db.end()
                    })
                })
            }
        }else {
            let db = mysql.createConnection(databaseOptions)
            db.connect((err) => {
                db.query(`SELECT * FROM users WHERE username = '${query.username}'`, (error, result) => {
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(result))
                    console.log('Returned: ' + JSON.stringify(result))
                    db.end()
                })
            })
        }
    }else {
        res.setHeader('Content-Type', 'text/html')
        res.end('<h1>Welcome to the Test Server</h1>')
    }
});


function getRating(user){
    return new Promise((resolve, reject) => {
        let db = mysql.createConnection(databaseOptions)
        db.connect((err) => {
            if (err){console.log(err); db.end(); return;}
            db.query(`SELECT * FROM users WHERE username = '${user}'`, (error, result) => {
                if (error){console.log(error)}
                resolve(result[0].rating)
                db.end()
            })
        })
    })
}


function gameEnded(id, result, players, endBy){
    let names = [clients.get(players[0]), clients.get(players[1])]
    addGame(id, result, names, endBy)
    if (result != '1/2-1/2'){
        
        updateRatings(players, result, false)
    }else {
        updateRatings(players, result, true)
    }
}

async function updateRatings(players, result, isDraw ) {
    let names = [clients.get(players[0]), clients.get(players[1])]
    let winner, loser;
    if (!isDraw){
        winner = (result == '1-0') ? names[0]:names[1]
        loser = (result == '1-0') ? names[1]:names[0]
    }else{
        winner = names[0]
        loser = names[1]
    }
    const winnerRating = await getRating(winner);
    const loserRating = await getRating(loser);

    const kFactor = 16; // Adjust this value based on your rating system

    let winnerScore, loserScore;
    if (isDraw) {
        winnerScore = 0.5;
        loserScore = 0.5;
    } else {
        winnerScore = 1;
        loserScore = 0;
    }

    const expectedWinnerScore = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
    const expectedLoserScore = 1 - expectedWinnerScore;

    const updatedWinnerRating = Math.round(winnerRating + kFactor * (winnerScore - expectedWinnerScore));
    const updatedLoserRating = Math.round(loserRating + kFactor * (loserScore - expectedLoserScore));

    // Update the ratings in the database
    const db = mysql.createConnection(databaseOptions);
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            db.end()
            return;
        }

        db.query(`UPDATE users SET rating = ${updatedWinnerRating} WHERE username = '${winner}'`, (err, result) => {
            if (err) { 
                console.error('Error updating rating:', err);
                db.end()
                return;
            }
            console.log(`Updated rating for ${winner}`);
            db.query(`UPDATE users SET rating = ${updatedLoserRating} WHERE username = '${loser}'`, (err, result) => {
                if (err) { 
                    console.error('Error updating rating:', err);
                    db.end()
                    return;
                }
                console.log(`Updated rating for ${loser}`);
                let toSend;
                if (clients.get(players[0]) == winner){
                    toSend = [updatedWinnerRating, updatedLoserRating]
                }else{
                    toSend = [updatedLoserRating, updatedWinnerRating]
                }
                players.forEach((soc) => {
                    soc.send(JSON.stringify({type: 'update', data: {ratings: toSend}}));
                })
                db.end()
            });
        });

       
    });
}

let queue = new Set();
let clients = new Map();
let games = new Map();
app.ws('/newGame', (ws, req) => {
    console.log('Connected to a new client')
    queue.add(ws)
    clients.set(ws, '')
    ws.send(JSON.stringify({message: 'Looking for Player'}))

    ws.on('message', (message) => {
        let data = JSON.parse(message)
        let game = games.get(data.gameId)
        switch (data.type){
            case 'details':
                for (let val of clients.values()){
                    if (val == data.user){
                        ws.send(JSON.stringify({message: 'Already in queue'}))
                        console.log(clients)
                        ws.close()
                        return;
                    }
                }
                clients.set(ws, data.user)
                matchMaking()
                break;
            case 'move':
                if (game.players.indexOf(ws) == game.turn){
                    game.move(data.move);
                }else {
                    ws.send(JSON.stringify({error: 'Not your turn'}));
                }
                break;
            case 'result':
                game.setResult(data.by, data.result)
                break;
            case 'draw':
                if (game.players.indexOf(ws) == 0){
                    if (game.blackDraw){
                        game.setResult('agreement')
                    }else{
                        game.whiteDraw = true;
                        game.players[1].send(JSON.stringify({type: 'offer', offer: 'draw'}))
                    }
                }else{
                    if (game.whiteDraw){
                        game.setResult('agreement')
                    }else{
                        game.blackDraw = true;
                        game.players[0].send(JSON.stringify({type: 'offer', offer: 'draw'}))
                    }
                }
                break; 
            case 'resign':
                game.setResult('resignation', (game.players.indexOf(ws)) ? 0:1)
                break
            default:
                console.log('Invalid message: ' + message)
                ws.close()
        }
    })
    ws.on('close', () => {
        let leaverColor;
        games.forEach((g) => {
            if (g.players.includes(ws)){
                if (!g.ended){
                    let leaverColor = g.players.indexOf(ws)                    
                    g.setResult('abandonment', Number(!leaverColor))
                }
            }
        })
        if (!leaverColor){
            clients.delete(ws)
            if (queue.has(ws)){
                queue.delete(ws);
            }
        }
        
        console.log('Connection closed')
    })
})


class Game{
    constructor(id, players){
        this.id = id;
        this.players = players;
        this.turn = 0;
        this.pgn = [];
        this.pNames = [clients.get(players[0]), clients.get(players[1])];
        this.ratings = []
        this.whiteDraw = false;
        this.blackDraw = false;
        this.setResult = this.setResult.bind(this)
        this.result;
        let wtime = new Timer(10 * 60 * 1000, () => this.setResult('time', 1))
        let btime = new Timer(10 * 60 * 1000, () => this.setResult('time', 0))
        setTimeout(() => setInterval(() => this.sendTime(wtime, btime), 100), 1000)
        
        this.timers = [wtime, btime];
        this.timers[0].start()
    }

    move(move){
        this.pgn.push(move.pgn);
        this.timers[this.turn].pause()
        this.turn = Number(!this.turn)
        this.timers[this.turn].start()
        this.whiteDraw = false;
        this.blackDraw = false;
        this.time = [this.timers[0].remainingTime, this.timers[1].remainingTime]
        this.players[this.turn].send(JSON.stringify({type: 'move', data: move}))
    }

    sendTime(wtime, btime){
        this.players.forEach((s) => s.send(JSON.stringify({type: 'time', data: [wtime.remainingTime, btime.remainingTime]})))
    }

    setResult(by, win){
        if (this.result){return}
        switch (by ){
            case 'time':
                this.result = (win) ? '0-1':'1-0'
                this.players.forEach((soc) => {
                    soc.send(JSON.stringify({type: 'result', data: {result: this.result, endBy: 'timeout'}}));
                })
                break;
            case 'abandonment':
                this.result = (win) ? '0-1':'1-0'
                this.players[win].send(JSON.stringify({type: 'result', data: {result: this.result, endBy: 'abandonment'}}))
                break;
            case 'agreement':
                this.result = '1/2-1/2'
                this.players.forEach((soc) => {
                    soc.send(JSON.stringify({type: 'result', data: {result: this.result, endBy: 'agreement'}}));
                })
                break;
            case 'resignation':
                this.result = (win) ? '0-1':'1-0'
                this.players.forEach((soc) => {
                    soc.send(JSON.stringify({type: 'result', data: {result: this.result, endBy: 'resignation'}}));
                })
                break;
            default:
                this.result = win   
        }

        gameEnded(this.id, this.result, this.players, by)
        this.players.forEach((soc) => {
            soc.send(JSON.stringify({type: 'pgn', data: this.pgn}));
        })
        this.ended = true;
        console.log(`Game ${this.id} has ended. Result: ${this.result} by ${by.charAt(0).toUpperCase() + by.slice(1)}`)        
    }
    
}

const generateGame = () => Math.random().toString(36).substring(2, 10);
async function matchMaking(){
    while (queue.size >= 2){
        let players = Array.from(queue).slice(0, 2);
        queue.delete(players[0]);
        queue.delete(players[1]);

        let game = new Game(generateGame(), players)
        games.set(game.id, game)


        let p1rat = await getRating(game.pNames[0])
        let p2rat = await getRating(game.pNames[1])
        let p1Info =  game.pNames[0] + " " + p1rat
        let p2Info =  game.pNames[1] + " " + p2rat

        players[0].send(JSON.stringify({type: 'start', gameId: game.id, color: 0, info: p2Info}))
        players[1].send(JSON.stringify({type: 'start', gameId: game.id, color: 1, info: p1Info}))

    }
};

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

function addGame(id, result, players, endBy){
    let database = mysql.createConnection(databaseOptions)

    database.connect((err)=>{
        if (err) {console.log(err); return}
        let values = `('${id}', '${result}', '${players[0]}', '${players[1]}', '${endBy}', NOW())`
        let query = 'INSERT into games (`Game Id`, `result`, `white`, `black`, `endBy`, `time`) VALUES ' + values
        database.query(query, err => {
            if (err) {console.log(err); return err}
            database.end()
            return 'Successful'
        })
    })
}