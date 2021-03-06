if (process.env.NODE_ENV != 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const router = express.Router()
const User = require('./models/user')


mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected to database'))

app.use(express.json())

const user_info = require('./routes/users')
app.use('/users', user_info)


const initializePassport = require('./passport-config')
router.get('/:id', getUser, (req, res) => {
    const email = res.json(res.user.email)
    console.log(email)
})
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

const users = []
const posts = []

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(methodOverride('_method'))

//Static files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))


app.use(passport.initialize())
app.use(passport.session())

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name, currentPosts: posts, postName: posts.name, pfp: req.user.profile_photo })
})

app.get('/login', checkNotAuthenticated, (req, res) =>  {
    res.render('login.ejs')
})

app.get('/profile', checkAuthenticated, (req, res) =>  {
    res.render('profile.ejs', { id: req.user.id, name: req.user.name, pfp: req.user.profile_photo })
})


app.get('/register', checkNotAuthenticated, (req, res) =>  {
    res.render('register.ejs')
})

app.get('/newpost', checkAuthenticated, (req, res) =>  {
    res.render('newpost.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: 'login',
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res) => {
try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        //users.push({
            //id: Date.now().toString(),
            //name: req.body.name,
            //email: req.body.email,
            //password: hashedPassword,
            //profile_photo: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg',
            //hasAward: false
        //})
        const user = new User({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            profile_photo: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg',
            hasAward: false
        })
        try {
            const newUser = await user.save()
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    
        
        res.redirect('/login')
        console.log(users)
    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

app.post('/newpost', checkAuthenticated, (req, res) => {
    var resultObject = users.findIndex((obj => obj.name == req.user.name));
    var resultPicture = users[resultObject].profile_photo
    var resultName = users[resultObject].name
    var award = users[resultObject].hasAward
    try {
    posts.push({
        post_id: Date.now().toString(),
        heading: req.body.heading,
        description: req.body.description,
        photo: req.body.photo,
        pfp: resultPicture,
        name: resultName,
        hasAward: award
    })
    } catch {
        res.redirect('/login')
    }
    console.log(posts)
    res.redirect('/')
})

function search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].name === nameKey) {
            return myArray[i];
        }
    }
}

app.post('/profile', checkAuthenticated, (req, res, next) => {
    var user = req.user.name;
    var resultObject = users.findIndex((obj => obj.name == req.user.name));
    users[resultObject].profile_photo = req.body.changePicture
    res.redirect('/profile')
})

app.delete('/logout', (req, res) => {
    req.logout()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    return res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}
async function getUser(req, res, next) {
    let user
    try {
        user = await User.findById(req.params.id)
        if (user == null) {
            return res.status(404).json({ message: 'Cannot find user' })    
        }
    } catch (err) {
        return res.status(500).json({ message: err.message})
    }

    res.user = user
    next()
}

app.listen(3000)

module.exports = router
