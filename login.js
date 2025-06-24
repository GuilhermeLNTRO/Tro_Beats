document.addEventListener('DOMContentLoaded', () => {
    console.log('Script da Página de Login TROBeats carregado!');

    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Validação simples no frontend
            if (!email || !password) {
                alert('Por favor, preencha todos os campos.'); // Mensagem de erro simples
                event.preventDefault(); // Impede o envio do formulário se a validação falhar
                return;
            }

            // Você pode adicionar validações de formato de email aqui, se desejar
            // Ex: if (!/\S+@\S+\.\S+/.test(email)) { alert('Email inválido'); event.preventDefault(); return; }

            console.log('Dados de login sendo enviados:', { email, password: '***' }); // Não logue a senha real!

            // O formulário será enviado normalmente via POST para a rota /login no backend
            // Nenhuma chamada fetch é necessária aqui, a menos que você queira um login AJAX.
            // Para login tradicional, o navegador envia o formulário.
        });
    }
});