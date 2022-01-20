const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require('./settings/routes');

app.use(cors({ credentials: true, origin: ['http://localhost:5005', 'http://127.0.0.1:5500'] }));
app.use(passport.initialize())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())


require('./middleware/passport')(passport)


const useSocket = require("socket.io");

let users = []

const start = async () => {
    try {
        routes(app);
        const server = app.listen(port, () => {
            console.log('Server has been started on port ' + port)
        })

        const io = useSocket(server)
        io.on('connection', function (socket) {
            socket.on('enter', (login) => {
                io.emit('enter', addUser(login, socket.id));
            });
            socket.on('sendMessage', ({ sender_login, receiver_login, text, firstname }) => {
                const user = findUser(receiver_login);
                if (users.some(user => user.login === receiver_login)) {
                    io.to(user.socketId).emit('getMessage', { sender_login, text, firstname })
                }
            })
            socket.on('getOnline', () => {
                io.emit('online', users)
            })
            socket.on('disconnect', () => {
                removeUser(socket.id)
                io.emit('online', users)
            })
        });

    } catch (e) {
        console.log(e)
    }
}

const addUser = (login, socketId) => {
    if (login && !users.some(user => user.socketId === socketId)) {
        users.push({ login, socketId })
        console.log(users)
    }
}

const removeUser = (socketId) => {
    if (users.some(user => user.socketId === socketId)) {
        users = users.filter(user => user.socketId !== socketId)
    }
}

const findUser = (login) => {
    if (login) {
        return users.find(user => user.login === login)
    }
}

start()

