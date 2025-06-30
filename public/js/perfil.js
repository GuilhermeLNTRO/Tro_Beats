document.addEventListener('DOMContentLoaded', () => {
    console.log('Script da Página de Login TROBeats carregado!');

    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                alert('Por favor, preencha todos os campos.');
                event.preventDefault();
                return;
            }

            console.log('Dados de login sendo enviados para o servidor.');
        });
    } else {
        console.warn('Formulário de login (.login-form) não encontrado na página.');
    }
});