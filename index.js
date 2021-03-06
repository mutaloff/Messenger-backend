const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require('./settings/routes');

app.use(cors({ credentials: true, origin: ['http://localhost:5000', 'http://127.0.0.1:5500', 'http://k-media.ugatu.su'] }));
app.use(passport.initialize())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

require('./middleware/passport')(passport)

const setLeavingTime = require('./Controller/usersController').setLeavingTime
const useSocket = require("socket.io");

let users = []

const start = async () => {
    try {
        routes(app);
        const server = app.listen(port, () => {
            console.log('Server has been started on port ' + port)
        })

        const io = useSocket(server)
        let is_read = 0
        io.on('connection', function (socket) {
            socket.on('enter', (login) => {
                io.emit('enter', addUser(login, socket.id));
            });

            socket.on('sendMessage', ({ sender_login, receiver_login, text, firstname, assignment, assignment_term }) => {
                const userAccs = findUser(sender_login, receiver_login, socket.id);
                if (users.some(user => user.login === receiver_login)) {
                    userAccs.forEach(user => {
                        io.to(user.socketId).emit('getMessage', { sender_login, text, firstname, is_read, assignment, assignment_term })
                    })
                }
            })
            socket.on('readMessage', (loginTo, loginFrom) => {
                const userAccs = findUser(loginTo, loginFrom, socket.id);
                if (users.some(user => user.login === loginFrom)) {
                    userAccs.forEach(user => {
                        io.to(user.socketId).emit('read')
                    })
                }
            })

            socket.on('getOnline', () => {
                io.emit('online', users)
            })

            socket.on('disconnect', () => {
                setLeavingTime(getUserBySocketId(socket.id))
                io.emit('exit', { user: getUserBySocketId(socket.id) })
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

const getUserBySocketId = (id) => {
    return users.filter(user => user.socketId === id)[0]?.login
}

const removeUser = (socketId) => {
    if (users.some(user => user.socketId === socketId)) {
        users = users.filter(user => user.socketId !== socketId)
    }
}

const findUser = (sender_login, receiver_login, id) => {
    if (receiver_login) {
        return users.filter(user => (user.login === sender_login || user.login === receiver_login) && user.socketId != id)
    }
}

start()

