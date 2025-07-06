const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Configurações do Express ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Configuração da Sessão ---
app.use(session({
    secret: 'sua_super_chave_secreta_e_unica_aqui_para_a_sessao', // MUDE ISSO EM PRODUÇÃO! Use uma string longa e aleatória.
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 'false' para HTTP (dev), 'true' para HTTPS (prod)
}));

// --- Middleware para popular o carrinho com dados de exemplo na sessão ---
// Isso garante que você sempre tenha itens no carrinho para testar
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [
            { id: 'item101', title: 'Epic Trap Beat', artist: 'Producer X', price: 29.99, cover: '/img/cart1.jpg', quantity: 1 },
            { id: 'item102', title: 'Chill Lo-Fi Beat', artist: 'BeatMaster', price: 19.99, cover: '/img/cart2.jpg', quantity: 1 },
            { id: 'item103', title: 'Hard Drill Beat', artist: 'DrillKing', price: 34.99, cover: '/img/cart3.jpg', quantity: 1 }
        ];
    }
    next();
});

// --- Dados de Exemplo para a Home (Trending Beats e New Releases) ---
const trendingBeatsData = [
    { id: 'beat1', title: 'Vision | 21savage x N...', artist: 'nohookz', price: 25.00, cover: '/img/beat1_cover.jpg', featured: false },
    { id: 'beat2', title: 'Ready | Humho x N...', artist: 'BIYO', price: 87.95, cover: '/img/beat2_cover.jpg', featured: false },
    { id: 'beat3', title: 'Time Back (Prod. b...', artist: 'kotsuru', price: 20.95, cover: '/img/beat3_cover.jpg', featured: false },
    { id: 'beat4', title: '100 BEATS FOR R$100', artist: 'waynocat', price: 100.00, cover: '/img/beat4_cover.jpg', featured: false },
    { id: 'beat5', title: 'MURDER - 1+9 FREE', artist: 'Gotenkeyy', price: 40.99, cover: '/img/beat5_cover.jpg', featured: false },
    { id: 'beat6', title: 'Rise (Pop)', artist: 'rabbel', price: 59.95, cover: '/img/beat6_cover.jpg', featured: false }
];

const newReleasesData = [
    { id: 'beat7', title: 'New Vibe (Chill Hop)', artist: 'producerX', price: 18.00, cover: '/img/new1-cover.jpg' },
    { id: 'beat8', title: 'Dark Trap Anthem', artist: 'beatlord', price: 35.00, cover: '/img/new2-cover.jpg' },
    { id: 'beat9', title: 'Summer Groove', artist: 'sunnymusic', price: 22.50, cover: '/img/new3-cover.jpg' }
];

const userData = {
    username: 'Guilherme',
    email: 'guilhermecezartec@gmail.com',
    profilePic: '/img/default-profile.png',
    isBeatmaker: true,
    producerName: 'Lil.Nego',
    bio: 'Sou um produtor musical apaixonado por criar batidas de Trap e Drill. Sempre buscando novos sons e inspirações.'
};

// --- Dados de Exemplo para Compras e Vendas (Beatmaker) ---
const userPurchasesData = [
    {
        id: 'purchase001',
        date: '2025-06-15',
        item: { id: 'beat1', title: 'Vision | 21savage x N...', artist: 'nohookz', price: 25.00, cover: '/img/beat1_cover.jpg' },
        amount: 25.00,
        license: '.wav'
    },
    {
        id: 'purchase002',
        date: '2025-05-20',
        item: { id: 'beat7', title: 'New Vibe (Chill Hop)', artist: 'producerX', price: 18.00, cover: '/img/new1-cover.jpg' },
        amount: 18.00,
        license: 'Basic'
    }
];

// O array beatmakerBeatsForSale será o "banco de dados" para operações de CRUD
// ATENÇÃO: Em um app real, estes dados viriam de um banco de dados persistente.
let beatmakerBeatsForSale = [
    { id: 'mybeat01', title: 'Sunset Trap', genre: 'Trap', price: 45.00, cover: '/img/mybeat_sunset.jpg', status: 'À Venda', salesCount: 1 },
    { id: 'mybeat02', title: 'Drill Aggressive', genre: 'Drill', price: 60.00, cover: '/img/mybeat_drill.jpg', status: 'Rascunho', salesCount: 0 },
    { id: 'mybeat03', title: 'Lo-Fi Chill Study', genre: 'Lo-Fi', price: 30.00, cover: '/img/mybeat_lofi.jpg', status: 'À Venda', salesCount: 1},
    { id: 'mybeat04', title: 'Boom Bap Groove', genre: 'Boom Bap', price: 50.00, cover: '/img/mybeat_boombap.jpg', status: 'Rascunho', salesCount: 0 }
];

const beatmakerSalesData = [
    {
        id: 'sale001',
        date: '2025-06-01',
        beat: { id: 'mybeat01', title: 'Sunset Trap', genre: 'Trap', price: 45.00, cover: '/img/mybeat_sunset.jpg' },
        buyer: 'comprador123',
        amount: 45.00,
        license: 'Exclusive'
    },
    {
        id: 'sale002',
        date: '2025-06-10',
        beat: { id: 'mybeat02', title: 'Drill Aggressive', genre: 'Drill', price: 60.00, cover: '/img/mybeat_drill.jpg' },
        buyer: 'clienteXYZ',
        amount: 60.00,
        license: 'Exclusive'
    }
];


// --- ROTAS DA APLICAÇÃO ---

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

    res.render('login', { messages: { success: 'Cadastro realizado com sucesso! Faça login para continuar.' } });
});

app.get('/login', (req, res) => {
    res.render('login', { messages: {} });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'guilhermecezartec@gmail.com' && password === '123456') {
        res.redirect('/perfil');
    } else {
        res.render('login', { messages: { error: 'Email ou senha inválidos.' }, formData: { email } });
    }
});

app.get('/catalogo', (req, res) => {
    res.send('Página de Catálogo (a ser implementada)');
});

app.get('/perfil', (req, res) => {
    res.render('perfil', { user: userData });
});

// Rota para a Página de Carrinho de Compras (GET)
app.get('/carrinho', (req, res) => {
    const cartItems = (req.session.cart || []).map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 0
    }));
    res.render('cart', { cartItems: cartItems });
});

// Rota para Remover um Item do Carrinho (DELETE)
app.delete('/carrinho/remover/:id', (req, res) => {
    const itemIdToRemove = req.params.id;
    let cart = req.session.cart || [];
    const initialCartLength = cart.length;

    cart = cart.filter(item => String(item.id) !== String(itemIdToRemove));

    if (cart.length < initialCartLength) {
        req.session.cart = cart;
        res.status(200).json({ message: 'Item removido com sucesso!' });
    } else {
        res.status(404).json({ message: 'Item não encontrado.' });
    }
});

// Rota para Adicionar um Item ao Carrinho (POST)
app.post('/carrinho/adicionar', (req, res) => {
    const { id, title, artist, price, cover } = req.body;

    if (!id || !title || !artist || !price || !cover) {
        return res.status(400).json({ message: 'Dados do beat incompletos para adicionar ao carrinho.' });
    }

    let cart = req.session.cart || [];
    const existingItemIndex = cart.findIndex(item => String(item.id) === String(id));

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 0) + 1;
    } else {
        cart.push({ id, title, artist, price: parseFloat(price), cover, quantity: 1 });
    }

    req.session.cart = cart;

    res.status(200).json({ message: 'Item adicionado ao carrinho com sucesso!', cartCount: cart.length });
});

app.get('/vender', (req, res) => {
    res.send('Página Começar a Vender (a ser implementada)');
});


// Rota para a página "Minhas Compras e Vendas"
app.get('/meus-negocios', (req, res) => {
    res.render('my-transactions', {
        user: userData, // Passa o objeto do usuário (para verificar 'isBeatmaker')
        purchases: userPurchasesData,
        sales: beatmakerSalesData,
        beatsForSale: beatmakerBeatsForSale // Este array é agora manipulável pelas rotas abaixo
    });
});

// --- ROTAS PARA GERENCIAMENTO DE BEATS (CRUD para Beatmakers) ---

// Rota para exibir o formulário de criação/edição de beat
// GET /vender-beat/novo ou GET /vender-beat/editar/:id
app.get('/vender-beat/:action/:id?', (req, res) => {
    const action = req.params.action; // 'novo' ou 'editar'
    const beatId = req.params.id; // ID do beat se for editar

    if (action === 'novo') {
        res.render('create-edit-beat', { title: 'Adicionar Novo Beat', beat: null, isEdit: false });
    } else if (action === 'editar' && beatId) {
        // Em um app real, você buscaria o beat do DB e verificaria se pertence ao usuário logado
        const beatToEdit = beatmakerBeatsForSale.find(b => String(b.id) === String(beatId));
        if (beatToEdit) {
            res.render('create-edit-beat', { title: `Editar Beat: ${beatToEdit.title}`, beat: beatToEdit, isEdit: true });
        } else {
            res.status(404).send('Beat não encontrado.');
        }
    } else {
        res.status(400).send('Requisição inválida.');
    }
});

// Rota para Criar um Novo Beat (POST)
app.post('/api/beats', (req, res) => {
    const { title, genre, price, cover, status } = req.body;

    // Em um app real, o ID seria gerado por um banco de dados
    const newBeatId = 'mybeat' + (Date.now().toString().slice(-5)); // Gera um ID simples e único
    const newBeat = {
        id: newBeatId,
        title,
        genre,
        price: parseFloat(price),
        cover: cover || '/img/default_beat_cover.jpg',
        status: status || 'Rascunho',
        salesCount: 0
    };

    beatmakerBeatsForSale.push(newBeat); // Adiciona ao array de beats à venda
    console.log('Novo beat adicionado:', newBeat);

    res.status(201).json({ message: 'Beat adicionado com sucesso!', beat: newBeat });
});

// Rota para Atualizar um Beat Existente (PUT)
app.put('/api/beats/:id', (req, res) => {
    const beatIdToUpdate = req.params.id;
    const { title, genre, price, cover, status } = req.body;

    const beatIndex = beatmakerBeatsForSale.findIndex(b => String(b.id) === String(beatIdToUpdate));

    if (beatIndex > -1) {
        // Atualiza os dados do beat, mantendo os que não foram alterados
        beatmakerBeatsForSale[beatIndex] = {
            ...beatmakerBeatsForSale[beatIndex],
            title: title !== undefined ? title : beatmakerBeatsForSale[beatIndex].title,
            genre: genre !== undefined ? genre : beatmakerBeatsForSale[beatIndex].genre,
            price: price !== undefined ? parseFloat(price) : beatmakerBeatsForSale[beatIndex].price,
            cover: cover !== undefined ? cover : beatmakerBeatsForSale[beatIndex].cover,
            status: status !== undefined ? status : beatmakerBeatsForSale[beatIndex].status
        };
        console.log(`Beat ${beatIdToUpdate} atualizado:`, beatmakerBeatsForSale[beatIndex]);
        res.status(200).json({ message: 'Beat atualizado com sucesso!', beat: beatmakerBeatsForSale[beatIndex] });
    } else {
        res.status(404).json({ message: 'Beat não encontrado para atualização.' });
    }
});

// Rota para Excluir um Beat (DELETE)
app.delete('/api/beats/:id', (req, res) => {
    const beatIdToDelete = req.params.id;

    const initialLength = beatmakerBeatsForSale.length;
    beatmakerBeatsForSale = beatmakerBeatsForSale.filter(b => String(b.id) !== String(beatIdToDelete));

    if (beatmakerBeatsForSale.length < initialLength) {
        console.log(`Beat ${beatIdToDelete} excluído com sucesso.`);
        res.status(200).json({ message: 'Beat excluído com sucesso!' });
    } else {
        res.status(404).json({ message: 'Beat não encontrado para exclusão.' });
    }
});


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor TROBeats rodando em http://localhost:${PORT}`);
});