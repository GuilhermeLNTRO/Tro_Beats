const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const multer = require('multer'); // Importa o Multer

const app = express();
const PORT = process.env.PORT || 3000;

let db; // Variável global para o banco de dados

// Chaves de Configuração do Google OAuth 2.0 (SUBSTITUA ESTES VALORES)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; 
const GOOGLE_CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET';

// URL BASE do Checkout Kiwify (URL do seu produto ou checkout dinâmico)
const KIWIFY_CHECKOUT_BASE_URL = 'https://kiwify.app/SEU_CHECKOUT_ID'; 

// --- Configuração do Multer para Upload de Arquivos (Capas e Áudio) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define o destino: 'public/img/beat-covers' para imagens ou 'private_audio' para áudio
        let destinationPath;
        if (file.fieldname === 'cover_image') {
            destinationPath = path.join(__dirname, 'public', 'img', 'beat-covers');
        } else if (file.fieldname === 'audio_file') {
            destinationPath = path.join(__dirname, 'private_audio');
        } else {
            return cb(new Error('Campo de arquivo desconhecido.'), false);
        }

        // Cria o diretório se ele não existir
        fs.mkdirSync(destinationPath, { recursive: true });
        cb(null, destinationPath);
    },
    filename: function (req, file, cb) {
        // Gera um nome de arquivo único para a capa ou áudio
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); 
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Define o middleware de upload para aceitar 1 imagem e 1 áudio
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'cover_image' && !file.mimetype.startsWith('image/')) {
            req.fileValidationError = 'A Capa deve ser um arquivo de imagem!';
            return cb(null, false);
        }
        if (file.fieldname === 'audio_file' && !file.mimetype.startsWith('audio/')) {
            req.fileValidationError = 'O Beat deve ser um arquivo de áudio (MP3)!';
            return cb(null, false);
        }
        cb(null, true);
    }
}).fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'audio_file', maxCount: 1 }
]);


// --- Configuração do Banco de Dados SQLite ---
async function initializeDatabase() {
    db = await open({
        filename: path.join(__dirname, 'trobeats_database.sqlite'),
        driver: sqlite3.Database
    });

    // Função auxiliar para executar consultas SQL e garantir a estrutura
    const run = (sql, params = []) => db.run(sql, params);
    
    console.log('Conectado ao SQLite com sucesso!');

    // 1. Criação das Tabelas (Estrutura completa)
    await run(`
        CREATE TABLE IF NOT EXISTS Users (
            UserID INTEGER PRIMARY KEY AUTOINCREMENT,
            Username TEXT NOT NULL UNIQUE,
            Email TEXT NOT NULL UNIQUE,
            PasswordHash TEXT NOT NULL,
            IsBeatmaker INTEGER NOT NULL DEFAULT 0,
            ProducerName TEXT,
            Bio TEXT,
            ProfilePicURL TEXT
        );
    `);
    
    await run(`
        CREATE TABLE IF NOT EXISTS Beats (
            BeatID TEXT PRIMARY KEY,
            Title TEXT NOT NULL,
            ArtistName TEXT NOT NULL,
            Genre TEXT,
            Price REAL NOT NULL,
            CoverImageURL TEXT,
            AudioFileURL TEXT NOT NULL,
            Status TEXT NOT NULL DEFAULT 'À Venda',
            SalesCount INTEGER NOT NULL DEFAULT 0,
            IsFeatured INTEGER NOT NULL DEFAULT 0,
            UploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            UploadedByUserID INTEGER,
            FOREIGN KEY (UploadedByUserID) REFERENCES Users(UserID)
        );
    `);
    
    await run(`
        CREATE TABLE IF NOT EXISTS Purchases (
            PurchaseID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER,
            BeatID TEXT,
            PurchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            AmountPaid REAL NOT NULL,
            LicenseType TEXT,
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (BeatID) REFERENCES Beats(BeatID)
        );
    `);
    
    await run(`
        CREATE TABLE IF NOT EXISTS Sales (
            SaleID INTEGER PRIMARY KEY AUTOINCREMENT,
            BeatID TEXT,
            SellerUserID INTEGER,
            BuyerUsername TEXT,
            SaleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            AmountReceived REAL NOT NULL,
            LicenseType TEXT,
            FOREIGN KEY (BeatID) REFERENCES Beats(BeatID),
            FOREIGN KEY (SellerUserID) REFERENCES Users(UserID)
        );
    `);

    // 2. Inserção de Dados de Exemplo (para carregar a página inicial)
    const userExists = await db.get("SELECT UserID FROM Users WHERE Username = 'Lil.Nego'");
    if (!userExists) {
        await run(`
            INSERT INTO Users (Username, Email, PasswordHash, IsBeatmaker, ProducerName, Bio, ProfilePicURL)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ['Lil.Nego', 'lilnego@trobeats.com', 'senha_secreta_123', 1, 'Lil.Nego', 'Um produtor de trap e drill.', '/img/default-profile.png']);
    }

    const userID = await db.get("SELECT UserID FROM Users WHERE Username = 'Lil.Nego'");

    const beat1Exists = await db.get("SELECT BeatID FROM Beats WHERE BeatID = 'beat1'");
    if (!beat1Exists) {
        await run(`
            INSERT INTO Beats (BeatID, Title, ArtistName, Price, CoverImageURL, AudioFileURL, Status, IsFeatured, UploadedByUserID, Genre, SalesCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, ['beat1', 'Midnight Drive', 'Lil.Nego', 50.00, '/img/beat-covers/cover1.jpg', 'beat1.mp3', 'À Venda', 1, userID.UserID, 'Trap', 0]);
    }
    
    const beat2Exists = await db.get("SELECT BeatID FROM Beats WHERE BeatID = 'beat2'");
    if (!beat2Exists) {
        await run(`
            INSERT INTO Beats (BeatID, Title, ArtistName, Price, CoverImageURL, AudioFileURL, Status, IsBeatmaker, UploadedByUserID, Genre, SalesCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, ['beat2', 'Drip Swag', 'Lil.Nego', 65.00, '/img/beat-covers/cover2.jpg', 'beat2.mp3', 'À Venda', 0, userID.UserID, 'Drill', 0]);
    }
}

// Inicializa o banco de dados antes de iniciar o servidor
initializeDatabase().catch(err => {
    console.error('Falha ao inicializar o banco de dados:', err);
    // Remove o arquivo de banco de dados para evitar o erro se a estrutura estiver corrompida
    if (err.code === 'SQLITE_ERROR') {
        if (fs.existsSync(path.join(__dirname, 'trobeats_database.sqlite'))) {
            fs.unlinkSync(path.join(__dirname, 'trobeats_database.sqlite'));
            console.log('Banco de dados corrompido removido. Por favor, reinicie o servidor.');
        } else {
            console.log('Banco de dados não encontrado ou falhou ao criar. Verifique permissões.');
        }
    }
    process.exit(1);
});

// --- Configurações do Express e Sessão ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da Sessão (Obrigatória para o Passport)
app.use(session({
    secret: 'sua_super_chave_secreta_e_unica_aqui_para_a_sessao',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Inicialização do Passport
app.use(passport.initialize());
app.use(passport.session());

// --- Configuração do Passport (MANTIDA) ---

// 1. Serialização: O que salvar na sessão (apenas o UserID)
passport.serializeUser((user, done) => {
    done(null, user.UserID);
});

// 2. Deserialização: Como carregar o usuário a partir do ID na sessão
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.get("SELECT * FROM Users WHERE UserID = ?", [id]);
        if (user) {
            const sessionUser = {
                UserID: user.UserID,
                username: user.Username,
                email: user.Email,
                isBeatmaker: user.IsBeatmaker,
                producerName: user.ProducerName,
                bio: user.Bio,
                profilePic: user.ProfilePicURL
            };
            done(null, sessionUser);
        } else {
            done(null, false);
        }
    } catch (err) {
        done(err, null);
    }
});

// 3. Estratégia Google
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback" // URL para onde o Google redireciona
},
async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    try {
        let user = await db.get("SELECT * FROM Users WHERE Email = ?", [email]);

        if (user) {
            // Usuário existente (Login normal)
            return done(null, user);
        } else {
            // Novo Usuário: Cria o registro básico e marca que ele precisa definir o papel
            const result = await db.run(`
                INSERT INTO Users (Username, Email, PasswordHash, IsBeatmaker, ProducerName)
                VALUES (?, ?, ?, ?, ?)
            `, [profile.displayName, email, 'GOOGLE_AUTH_TOKEN', 0, null]);
            
            const newUser = {
                UserID: result.lastID,
                username: profile.displayName,
                email: email,
                isBeatmaker: 0,
                needsRoleSelection: true // Flag para redirecionar para seleção de função
            };
            return done(null, newUser);
        }
    } catch (err) {
        return done(err, null);
    }
}));


// --- ROTAS DE AUTENTICAÇÃO (MANTIDA) ---

// Inicia o fluxo de login do Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// Rota de Callback após o Google autenticar
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (req.user && req.user.needsRoleSelection) {
        res.redirect('/auth/select-role');
    } else {
        res.redirect('/');
    }
  });

// Rota para Logout
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Rota para Seleção de Perfil (NOVO)
app.get('/auth/select-role', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    res.render('select-role'); 
});

// Rota 5: Confirmação do Perfil (NOVO)
app.post('/auth/confirm-role', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    const isBeatmaker = req.body.role === 'beatmaker' ? 1 : 0;
    const producerName = req.body.producer_name || null;
    const userId = req.user.UserID;

    try {
        await db.run(`
            UPDATE Users
            SET IsBeatmaker = ?, ProducerName = ?
            WHERE UserID = ?
        `, [isBeatmaker, producerName, userId]);

        req.user.isBeatmaker = isBeatmaker;
        req.user.producerName = producerName;

        res.redirect('/perfil');
    } catch (err) {
        console.error('Erro ao definir função do usuário:', err);
        res.status(500).send('Erro ao finalizar o cadastro.');
    }
});

// --- ROTAS DE COMPRAS E CHECKOUT (NOVAS) ---

// Rota 6: Inicia o processo de Checkout/Pagamento
app.post('/checkout', async (req, res) => {
    const currentUser = req.isAuthenticated() ? req.user : req.session.user;

    if (!currentUser) {
        return res.status(401).json({ message: 'Você precisa estar logado para finalizar a compra.' });
    }

    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(400).json({ message: 'O carrinho está vazio.' });
    }

    let totalAmount = 0;
    const cartItems = req.session.cart;

    try {
        // Validação e cálculo do total (obter preços frescos do DB)
        const beatIds = cartItems.map(item => `'${item.id}'`).join(',');
        const dbBeats = await db.all(`SELECT BeatID as id, Price as price, UploadedByUserID FROM Beats WHERE BeatID IN (${beatIds})`);
        
        if (dbBeats.length !== cartItems.length) {
            return res.status(400).json({ message: 'Um ou mais beats no carrinho não são válidos.' });
        }

        const beatMap = new Map(dbBeats.map(beat => [beat.id, beat]));

        for (const item of cartItems) {
            const beatDetails = beatMap.get(item.id);
            if (!beatDetails) continue; 
            totalAmount += beatDetails.price * (item.quantity || 1);
        }

        // 1. Criação do OrderToken (ID ÚNICO para rastrear o pedido)
        const orderToken = `ORDER_${Date.now()}_${currentUser.UserID}`;
        
        // 2. Salvamos os detalhes da transação para uso na rota de sucesso do Webhook (simulada na sessão)
        req.session.pendingOrder = {
            orderToken: orderToken,
            items: cartItems,
            total: totalAmount,
            userId: currentUser.UserID
        };

        // 3. Constrói a URL de redirecionamento para a Kiwify
        const redirectUrl = `${KIWIFY_CHECKOUT_BASE_URL}?ref=${orderToken}&total=${totalAmount.toFixed(2)}`;

        res.json({ success: true, redirectUrl: redirectUrl });

    } catch (err) {
        console.error('Erro durante o checkout:', err);
        res.status(500).json({ message: 'Erro interno ao processar o checkout.' });
    }
});

// Rota 7: Webhook Simulado de Sucesso de Pagamento (Rota de Retorno da Kiwify)
app.get('/payment-success', async (req, res) => {
    const orderToken = req.query.token;
    const pendingOrder = req.session.pendingOrder;

    if (!pendingOrder || pendingOrder.orderToken !== orderToken) {
        return res.render('message', { title: 'Pagamento Inválido', message: 'Token de pedido não encontrado ou inválido.' });
    }

    try {
        const { items, total, userId } = pendingOrder;
        const buyerUsername = (req.user && req.user.username) || 'Convidado';

        // 1. Processar cada item do carrinho como compra e venda
        for (const item of items) {
            const beatDetails = await db.get(`SELECT UploadedByUserID, ArtistName FROM Beats WHERE BeatID = ?`, [item.id]);
            
            if (beatDetails) {
                // Registrar Compra (para o comprador)
                await db.run(`
                    INSERT INTO Purchases (UserID, BeatID, AmountPaid, LicenseType)
                    VALUES (?, ?, ?, ?)
                `, [userId, item.id, item.price, 'Standard']); // Licença simplificada

                // Registrar Venda (para o beatmaker)
                await db.run(`
                    INSERT INTO Sales (BeatID, SellerUserID, BuyerUsername, AmountReceived, LicenseType)
                    VALUES (?, ?, ?, ?, ?)
                `, [item.id, beatDetails.UploadedByUserID, buyerUsername, item.price, 'Standard']);
                
                // Atualizar contagem de vendas do beat
                await db.run(`UPDATE Beats SET SalesCount = SalesCount + 1 WHERE BeatID = ?`, [item.id]);
            }
        }

        // 2. Limpar o carrinho e o pedido pendente
        req.session.cart = [];
        delete req.session.pendingOrder;

        // 3. Renderizar a tela de sucesso
        res.render('payment-success', { total: total.toFixed(2), items: items.length });

    } catch (err) {
        console.error('Erro ao finalizar transação:', err);
        res.render('message', { title: 'Erro de Transação', message: 'Ocorreu um erro interno ao registrar seu pedido. Entre em contato com o suporte.' });
    }
});


// --- ROTAS DA APLICAÇÃO (AJUSTADAS PARA UPLOAD) ---

app.get('/', async (req, res) => {
    try {
        const trendingBeatsResult = await db.all(`
            SELECT BeatID as id, Title, ArtistName as artist, Price as price, CoverImageURL as cover, AudioFileURL as audioUrl, IsFeatured as featured
            FROM Beats
            WHERE IsFeatured = 1 AND Status = 'À Venda'
        `);
        const newReleasesResult = await db.all(`
            SELECT BeatID as id, Title, ArtistName as artist, Price as price, CoverImageURL as cover, AudioFileURL as audioUrl
            FROM Beats
            WHERE Status = 'À Venda'
            ORDER BY UploadDate DESC
        `);

        res.render('index', {
            trendingBeats: trendingBeatsResult,
            newReleases: newReleasesResult
        });
    } catch (err) {
        console.error('Erro ao carregar beats para a página inicial:', err);
        res.status(500).send('Erro interno do servidor ao carregar beats.');
    }
});

app.get('/register', (req, res) => {
    res.render('register', { messages: {} });
});

app.post('/register', async (req, res) => {
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

    try {
        const isBeatmaker = is_beatmaker === 'on' ? 1 : 0;
        await db.run(`
            INSERT INTO Users (Username, Email, PasswordHash, IsBeatmaker, ProducerName, Bio)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [username, email, password, isBeatmaker, producer_name || null, bio || null]);
        
        res.render('login', { messages: { success: 'Cadastro realizado com sucesso! Faça login para continuar.' } });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        errors.error = 'Email ou nome de usuário já cadastrado ou erro no registro.';
        res.render('register', { messages: errors, formData: req.body });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { messages: {} });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get(`
            SELECT UserID, Username, Email, PasswordHash, IsBeatmaker, ProducerName, Bio, ProfilePicURL
            FROM Users
            WHERE Email = ?
        `, [email]);

        if (user) {
            if (password === user.PasswordHash) {
                req.session.user = {
                    UserID: user.UserID,
                    username: user.Username,
                    email: user.Email,
                    isBeatmaker: user.IsBeatmaker,
                    producerName: user.ProducerName,
                    bio: user.Bio,
                    profilePic: user.ProfilePicURL
                };
                res.redirect('/perfil');
            } else {
                res.render('login', { messages: { error: 'Email ou senha inválidos.' }, formData: { email } });
            }
        } else {
            res.render('login', { messages: { error: 'Email ou senha inválidos.' }, formData: { email } });
        }
    } catch (err) {
        console.error('Erro ao tentar fazer login:', err);
        res.status(500).send('Erro interno do servidor ao tentar fazer login.');
    }
});

app.get('/catalogo', (req, res) => {
    res.send('Página de Catálogo (a ser implementada)');
});

app.get('/perfil', async (req, res) => {
    // Usamos req.user se o login for via Passport, ou req.session.user se for via formulário tradicional
    const currentUserData = req.isAuthenticated() ? req.user : req.session.user;

    if (!currentUserData) {
        return res.status(401).send('Não autorizado. Por favor, faça login.');
    }

    try {
        const userFromDB = await db.get(`
            SELECT UserID, Username, Email, IsBeatmaker, ProducerName, Bio, ProfilePicURL
            FROM Users
            WHERE UserID = ?
        `, [currentUserData.UserID]);

        if (userFromDB) {
            res.render('perfil', { user: userFromDB });
        } else {
            res.status(404).send('Perfil do usuário não encontrado.');
        }
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        res.status(500).send('Erro interno do servidor ao carregar perfil.');
    }
});

app.get('/carrinho', async (req, res) => {
    let cartItems = [];
    if (req.session.cart && req.session.cart.length > 0) {
        try {
            const beatIds = req.session.cart.map(item => `'${item.id}'`).join(',');
            
            if (beatIds) {
                const beatsInCartResult = await db.all(`
                    SELECT BeatID as id, Title, ArtistName as artist, Price as price, CoverImageURL as cover
                    FROM Beats
                    WHERE BeatID IN (${beatIds})
                `);
                const beatsMap = new Map(beatsInCartResult.map(beat => [beat.id, beat]));

                cartItems = req.session.cart.map(sessionItem => {
                    const dbBeat = beatsMap.get(sessionItem.id);
                    return dbBeat ? { ...dbBeat, quantity: sessionItem.quantity } : null;
                }).filter(item => item !== null);
            }
        } catch (err) {
            console.error('Erro ao buscar detalhes de beats para o carrinho:', err);
        }
    }
    res.render('cart', { cartItems: cartItems });
});

app.delete('/carrinho/remover/:id', (req, res) => {
    const itemIdToRemove = req.params.id;
    let cart = req.session.cart || [];
    const initialCartLength = cart.length;

    cart = cart.filter(item => String(item.id) !== String(itemIdToRemove));

    if (cart.length < initialCartLength) {
        req.session.cart = cart;
        res.status(200).json({ message: 'Item removido com sucesso!' });
    } else {
        res.status(404).json({ message: 'Item não encontrado no carrinho.' });
    }
});

app.post('/carrinho/adicionar', async (req, res) => {
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
    const currentUser = req.isAuthenticated() ? req.user : req.session.user;

    if (!currentUser) {
        return res.status(401).send('Não autorizado. Por favor, faça login.');
    }
    
    // Verifica se IsBeatmaker é 1 (true)
    if (currentUser.isBeatmaker === 1) { 
        res.redirect('/vender-beat/novo');
    } else {
        res.status(403).send('Para começar a vender, você precisa ser um Beatmaker registrado.');
    }
});

app.get('/meus-negocios', async (req, res) => {
    const currentUser = req.isAuthenticated() ? req.user : req.session.user;

    if (!currentUser) {
        return res.status(401).send('Não autorizado. Por favor, faça login.');
    }

    const loggedInUserId = currentUser.UserID;

    try {
        
        // Compras
        const purchases = await db.all(`
            SELECT PurchaseID as id, PurchaseDate as date, AmountPaid as amount, LicenseType as license,
                   b.BeatID as item_id, b.Title as item_title, b.ArtistName as item_artist, b.Price as item_price, b.CoverImageURL as item_cover
            FROM Purchases p
            JOIN Beats b ON p.BeatID = b.BeatID
            WHERE p.UserID = ?
            ORDER BY PurchaseDate DESC
        `, [loggedInUserId]);
        
        const formattedPurchases = purchases.map(row => ({
            id: row.id,
            date: new Date(row.date).toISOString().split('T')[0],
            item: {
                id: row.item_id,
                title: row.item_title,
                artist: row.item_artist,
                price: row.item_price,
                cover: row.item_cover
            },
            amount: row.amount,
            license: row.license
        }));

        // Beats colocados à venda pelo usuário (Seller)
        const beatsForSale = await db.all(`
            SELECT BeatID as id, Title, Genre, Price as price, CoverImageURL as cover, Status, SalesCount
            FROM Beats
            WHERE UploadedByUserID = ?
            ORDER BY UploadDate DESC
        `, [loggedInUserId]);

        // Vendas
        const sales = await db.all(`
            SELECT SaleID as id, SaleDate as date, BuyerUsername as buyer, AmountReceived as amount, LicenseType as license,
                   b.BeatID as beat_id, b.Title as beat_title, b.Genre as beat_genre, b.Price as beat_price, b.CoverImageURL as beat_cover
            FROM Sales s
            JOIN Beats b ON s.BeatID = b.BeatID
            WHERE s.SellerUserID = ?
            ORDER BY SaleDate DESC
        `, [loggedInUserId]);

        const formattedSales = sales.map(row => ({
            id: row.id,
            date: new Date(row.date).toISOString().split('T')[0],
            beat: {
                id: row.beat_id,
                title: row.beat_title,
                genre: row.beat_genre,
                price: row.beat_price,
                cover: row.beat_cover
            },
            buyer: row.buyer,
            amount: row.amount,
            license: row.license
        }));


        res.render('my-transactions', {
            user: currentUser,
            purchases: formattedPurchases,
            sales: formattedSales,
            beatsForSale: beatsForSale
        });

    } catch (err) {
        console.error('Erro ao carregar dados para Minhas Compras e Vendas:', err);
        res.status(500).send('Erro interno do servidor ao carregar transações.');
    }
});

app.get('/vender-beat/:action/:id?', async (req, res) => {
    const action = req.params.action;
    const beatId = req.params.id;
    let beatToEdit = null;

    const currentUser = req.isAuthenticated() ? req.user : req.session.user;

    if (!currentUser || currentUser.isBeatmaker !== 1) {
        return res.status(403).send('Não autorizado. Você precisa ser um beatmaker para gerenciar beats.');
    }

    if (action === 'editar' && beatId) {
        try {
            beatToEdit = await db.get(`
                SELECT BeatID as id, Title, Genre, Price as price, CoverImageURL as cover, Status, AudioFileURL as audioUrl
                FROM Beats
                WHERE BeatID = ? AND UploadedByUserID = ?
            `, [beatId, currentUser.UserID]);

            if (!beatToEdit) {
                return res.status(404).send('Beat não encontrado ou você não tem permissão para editá-lo.');
            }
        } catch (err) {
            console.error('Erro ao buscar beat para edição:', err);
            return res.status(500).send('Erro interno do servidor ao carregar beat para edição.');
        }
    }

    res.render('create-edit-beat', {
        title: action === 'novo' ? 'Adicionar Novo Beat' : `Editar Beat: ${beatToEdit ? beatToEdit.Title : ''}`,
        beat: beatToEdit,
        isEdit: action === 'editar'
    });
});

app.post('/api/beats', upload, async (req, res) => { 
    const currentUser = req.isAuthenticated() ? req.user : req.session.user;
    
    // Verifica erros do Multer (ex: arquivo não é imagem/áudio)
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }

    if (!currentUser || currentUser.isBeatmaker != 1) { 
        return res.status(403).json({ message: 'Não autorizado. Você precisa ser um beatmaker para adicionar beats.' });
    }
    
    // Verifica se os arquivos necessários foram enviados
    if (!req.files || !req.files.cover_image || !req.files.audio_file) {
        return res.status(400).json({ message: 'A capa e o arquivo de áudio são obrigatórios.' });
    }

    const { title, genre, price, status } = req.body;
    const uploaderUserId = currentUser.UserID;
    
    // Extrai o caminho dos arquivos salvos pelo Multer
    const coverImagePath = `/img/beat-covers/${req.files.cover_image[0].filename}`;
    const audioFileName = req.files.audio_file[0].filename;

    if (!title || !genre || !price) {
        // Se faltar dados do corpo, tentamos limpar os arquivos enviados
        if (req.files.cover_image) fs.unlinkSync(req.files.cover_image[0].path);
        if (req.files.audio_file) fs.unlinkSync(req.files.audio_file[0].path);
        return res.status(400).json({ message: 'Dados do beat incompletos.' });
    }

    try {
        const newBeatId = 'beat_' + Date.now().toString().slice(-8);
        const artistName = currentUser.producerName || currentUser.username; 

        await db.run(`
            INSERT INTO Beats (BeatID, Title, ArtistName, Price, CoverImageURL, AudioFileURL, Genre, Status, SalesCount, IsFeatured, UploadedByUserID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [newBeatId, title, artistName, parseFloat(price), coverImagePath, audioFileName, genre, status || 'À Venda', 0, 0, uploaderUserId]);
        
        res.status(201).json({ message: 'Beat adicionado com sucesso!', beatId: newBeatId });
    } catch (err) {
        console.error('Erro ao adicionar beat:', err);
        // Em caso de erro no DB, tentamos limpar os arquivos enviados
        if (req.files.cover_image) fs.unlinkSync(req.files.cover_image[0].path);
        if (req.files.audio_file) fs.unlinkSync(req.files.audio_file[0].path);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar beat.' });
    }
});

app.put('/api/beats/:id', upload, async (req, res) => { // Adicionando o middleware upload aqui!
    const currentUser = req.isAuthenticated() ? req.user : req.session.user;
    if (!currentUser || currentUser.isBeatmaker !== 1) {
        return res.status(403).json({ message: 'Não autorizado. Você precisa ser um beatmaker para editar beats.' });
    }

    const beatIdToUpdate = req.params.id;
    const { title, genre, price, status } = req.body;
    const uploaderUserId = currentUser.UserID;

    try {
        // Busca o beat antigo para saber o caminho dos arquivos
        const oldBeat = await db.get("SELECT CoverImageURL, AudioFileURL FROM Beats WHERE BeatID = ?", [beatIdToUpdate]);

        // Define os novos caminhos ou mantém os antigos
        const newCoverImagePath = req.files && req.files.cover_image ? `/img/beat-covers/${req.files.cover_image[0].filename}` : oldBeat.CoverImageURL;
        const newAudioFileName = req.files && req.files.audio_file ? req.files.audio_file[0].filename : oldBeat.AudioFileURL;
        
        // Se um novo arquivo foi enviado, excluímos o antigo
        if (req.files && req.files.cover_image) {
            fs.unlinkSync(path.join(__dirname, 'public', oldBeat.CoverImageURL)); // Deve usar oldBeat.CoverImageURL aqui
        }
        if (req.files && req.files.audio_file) {
            fs.unlinkSync(path.join(__dirname, 'private_audio', oldBeat.AudioFileURL));
        }

        const result = await db.run(`
            UPDATE Beats
            SET Title = ?, Genre = ?, Price = ?,
                CoverImageURL = ?, AudioFileURL = ?, Status = ?
            WHERE BeatID = ? AND UploadedByUserID = ?
        `, [title, genre, parseFloat(price), newCoverImagePath, newAudioFileName, status, beatIdToUpdate, uploaderUserId]);

        if (result.changes > 0) {
            res.status(200).json({ message: 'Beat atualizado com sucesso!' });
        } else {
            res.status(404).json({ message: 'Beat não encontrado ou você não tem permissão para editá-lo.' });
        }
    } catch (err) {
        console.error('Erro ao atualizar beat:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar beat.' });
    }
});

app.delete('/api/beats/:id', async (req, res) => {
    const currentUser = req.isAuthenticated() ? req.user : req.session.user;
    if (!currentUser || currentUser.isBeatmaker !== 1) {
        return res.status(403).json({ message: 'Não autorizado. Você precisa ser um beatmaker para excluir beats.' });
    }

    const beatIdToDelete = req.params.id;
    const uploaderUserId = currentUser.UserID;

    try {
        // Busca para deletar arquivos físicos
        const beatToDelete = await db.get("SELECT CoverImageURL, AudioFileURL FROM Beats WHERE BeatID = ?", [beatIdToDelete]);

        if (beatToDelete) {
            // Deleta arquivos físicos
            const coverPath = path.join(__dirname, 'public', beatToDelete.CoverImageURL);
            const audioPath = path.join(__dirname, 'private_audio', beatToDelete.AudioFileURL);
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        }

        const result = await db.run(`
            DELETE FROM Beats
            WHERE BeatID = ? AND UploadedByUserID = ?
        `, [beatIdToDelete, uploaderUserId]);

        if (result.changes > 0) {
            res.status(200).json({ message: 'Beat excluído com sucesso!' });
        } else {
            res.status(404).json({ message: 'Beat não encontrado ou você não tem permissão para excluí-lo.' });
        }
    } catch (err) {
        console.error('Erro ao excluir beat:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir beat.' });
    }
});


app.get('/play-beat/:beatId', async (req, res) => {
    const beatId = req.params.beatId;

    try {
        const foundBeat = await db.get(`
            SELECT AudioFileURL
            FROM Beats
            WHERE BeatID = ?
        `, [beatId]);

        if (foundBeat && foundBeat.AudioFileURL) {
            const filename = foundBeat.AudioFileURL; 
            const audioFilePath = path.join(__dirname, 'private_audio', `${filename}`);
            
            if (!fs.existsSync(audioFilePath)) {
                return res.status(404).send('Arquivo de áudio não encontrado no servidor.');
            }
            
            res.set('Content-Type', 'audio/mp3');

            const ffprobe = require('ffprobe-static');
            
            const ffprobeProcess = spawn(ffprobe.path, [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                audioFilePath
            ]);

            let fileDuration = 0;
            ffprobeProcess.stdout.on('data', (data) => {
                fileDuration = parseFloat(data.toString());
            });

            ffprobeProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Erro ao obter a duração do arquivo de áudio.');
                    return res.status(500).send('Erro ao processar o áudio.');
                }
                
                const cutterProcess = spawn('ffmpeg', [
                    '-i', audioFilePath,
                    '-ss', '0',
                    '-t', `${Math.min(15, fileDuration)}`,
                    '-f', 'mp3',
                    '-acodec', 'copy',
                    'pipe:1'
                ]);

                cutterProcess.stdout.pipe(res);

                cutterProcess.on('error', (err) => {
                    console.error('Erro ao cortar o áudio com ffmpeg:', err);
                    res.status(500).send('Erro ao processar o áudio.');
                });
            });

        } else {
            res.status(404).send('Beat ou URL de áudio não encontrado.');
        }
    } catch (err) {
        console.error('Erro ao buscar URL de áudio no DB ou processar o arquivo:', err);
        res.status(500).send('Erro interno do servidor ao buscar informações do beat.');
    }
});


app.listen(PORT, () => {
    console.log(`Servidor TROBeats rodando em http://localhost:${PORT}`);
    console.log(`Acesse a página inicial em: http://localhost:${PORT}/`);
    console.log(`Acesse o carrinho de exemplo em: http://localhost:${PORT}/carrinho`);
    console.log(`Acesse o perfil de exemplo (beatmaker) em: http://localhost:${PORT}/perfil`);
    console.log(`Acesse as transações de exemplo em: http://localhost:${PORT}/meus-negocios`);
});