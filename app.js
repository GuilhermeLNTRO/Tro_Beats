const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const trendingBeatsData = [
    { id: 1, title: 'Vision | 21savage x N...', artist: 'nohookz', price: '25.00', cover: '/img/beat1-cover.jpg', featured: false },
    { id: 2, title: 'Ready | Humho x N...', artist: 'BIYO', price: '24.95', cover: '/img/beat2-cover.jpg', featured: true },
    { id: 3, title: 'Time Back (Prod. b...', artist: 'kotsuru', price: '20.95', cover: '/img/beat3-cover.jpg', featured: false },
    { id: 4, title: '100 BEATS FOR $100', artist: 'waynocat', price: '100.00', cover: '/img/beat4-cover.jpg', featured: false },
    { id: 5, title: 'MURDER - 1+9 FREE', artist: 'Gotenkeyy', price: '20.99', cover: '/img/beat5-cover.jpg', featured: false },
    { id: 6, title: 'Rise (Pop)', artist: 'rabbel', price: '29.95', cover: '/img/beat6-cover.jpg', featured: false }
];

const newReleasesData = [
    { id: 7, title: 'New Vibe (Chill Hop)', artist: 'producerX', price: '18.00', cover: '/img/new1-cover.jpg' },
    { id: 8, title: 'Dark Trap Anthem', artist: 'beatlord', price: '35.00', cover: '/img/new2-cover.jpg' },
    { id: 9, title: 'Summer Groove', artist: 'sunnymusic', price: '22.50', cover: '/img/new3-cover.jpg' }
];

const cartItemsData = [
    { id: 101, title: 'Epic Trap Beat', artist: 'Producer X', price: 29.99, cover: '/img/cart1.jpg', quantity: 1 },
    { id: 102, title: 'Chill Lo-Fi Beat', artist: 'BeatMaster', price: 19.99, cover: '/img/cart2.jpg', quantity: 2 },
    { id: 103, title: 'Hard Drill Beat', artist: 'DrillKing', price: 34.99, cover: '/img/cart3.jpg', quantity: 1 }
];

app.get('/', (req, res) => {
    res.render('index', {
        trendingBeats: trendingBeatsData,
        newReleases: newReleasesData
    });
});

app.get('/register', (req, res) => {
    res.render('register', { messages: {} });
});

app.post('/register', (req, res) => {
    const { username, email, password, confirm_password, is_beatmaker, producer_name, bio } = req.body;

    let errors = {};

    if (!username || !email || !password || !confirm_password) {
        errors.error = 'Por favor, preencha todos os campos obrigatórios.';
    } else if (password !== confirm_password) {
        errors.error = 'As senhas não coincidem.';
    } else if (password.length < 6) {
        errors.error = 'A senha deve ter no mínimo 6 caracteres.';
    } else if (is_beatmaker === 'on' && !producer_name) {
        errors.error = 'Nome Artístico é obrigatório para Beatmakers.';
    }

    if (Object.keys(errors).length > 0) {
        return res.render('register', { messages: errors, formData: req.body });
    }

    console.log('Dados de Cadastro Recebidos:', {
        username,
        email,
        is_beatmaker: is_beatmaker === 'on' ? true : false,
        producer_name: producer_name || 'N/A',
        bio: bio || 'N/A'
    });

    res.render('login', { messages: { success: 'Cadastro realizado com sucesso! Faça login para continuar.' } });
});

app.get('/login', (req, res) => {
    res.render('login', { messages: {} });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'teste@exemplo.com' && password === '123456') {
        console.log('Login bem-sucedido (simulação)!');
        res.render('login', { messages: { success: 'Login bem-sucedido! Bem-vindo(a).' } });
    } else {
        console.log('Login falhou (simulação)!');
        res.render('login', { messages: { error: 'Email ou senha inválidos.' }, formData: { email } });
    }
});

app.get('/catalogo', (req, res) => {
    res.send('Página de Catálogo (a ser implementada)');
});

app.get('/perfil', (req, res) => {
    res.send('Página de Perfil (a ser implementada)');
});

app.get('/carrinho', (req, res) => {
    res.render('cart', { cartItems: cartItemsData });
});

app.get('/vender', (req, res) => {
    res.send('Página Começar a Vender (a ser implementada)');
});

app.listen(PORT, () => {
    console.log(`Servidor TROBeats rodando em http://localhost:${PORT}`);
});