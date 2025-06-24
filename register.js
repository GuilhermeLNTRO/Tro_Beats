document.addEventListener('DOMContentLoaded', () => {
    const isBeatmakerCheckbox = document.getElementById('is_beatmaker');
    const beatmakerFieldsDiv = document.getElementById('beatmaker-fields');

    if (isBeatmakerCheckbox && beatmakerFieldsDiv) {
        // Função para alternar a visibilidade dos campos de beatmaker
        const toggleBeatmakerFields = () => {
            if (isBeatmakerCheckbox.checked) {
                beatmakerFieldsDiv.classList.remove('beatmaker-fields-hidden');
                beatmakerFieldsDiv.classList.add('beatmaker-fields-visible');
                // Opcional: tornar campos como 'producer_name' required se o checkbox estiver marcado
                beatmakerFieldsDiv.querySelectorAll('input, textarea').forEach(field => {
                    if (field.id === 'producer_name') { // Somente nome artístico é obrigatório
                        field.required = true;
                    }
                });
            } else {
                beatmakerFieldsDiv.classList.remove('beatmaker-fields-visible');
                beatmakerFieldsDiv.classList.add('beatmaker-fields-hidden');
                // Opcional: remover o atributo required quando os campos estiverem ocultos
                beatmakerFieldsDiv.querySelectorAll('input, textarea').forEach(field => {
                    field.required = false;
                });
            }
        };

        // Adiciona o event listener ao checkbox
        isBeatmakerCheckbox.addEventListener('change', toggleBeatmakerFields);

        // Chama a função uma vez ao carregar a página para definir o estado inicial
        // Isso é importante se o usuário voltar para a página e o checkbox já estava marcado
        toggleBeatmakerFields();
    }

    // Exemplo básico de validação de senha no lado do cliente
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const registerForm = document.querySelector('.register-form');

    if (registerForm && passwordInput && confirmPasswordInput) {
        registerForm.addEventListener('submit', (event) => {
            // Limpa mensagens de erro anteriores (se houver um elemento para isso)
            // const errorMessageDiv = document.querySelector('.alert.error-message');
            // if (errorMessageDiv) errorMessageDiv.remove();

            if (passwordInput.value !== confirmPasswordInput.value) {
                alert('As senhas não coincidem!'); // Use um elemento HTML para erro em vez de alert em produção
                event.preventDefault(); // Impede o envio do formulário
            } else if (passwordInput.value.length < 6) {
                alert('A senha deve ter no mínimo 6 caracteres.');
                event.preventDefault();
            }
            // Outras validações de campos podem ser adicionadas aqui
        });
    }
});