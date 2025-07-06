document.addEventListener('DOMContentLoaded', () => {
    const beatForm = document.getElementById('beatForm');

    if (beatForm) {
        beatForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário

            const formData = new FormData(beatForm);
            const beatData = Object.fromEntries(formData.entries());

            // Pega o ID do beat se estiver editando (assumindo que o ID virá da URL)
            const pathSegments = window.location.pathname.split('/');
            const isEdit = pathSegments.includes('editar');
            const beatId = isEdit ? pathSegments[pathSegments.length - 1] : null;

            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `/api/beats/${beatId}` : '/api/beats';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(beatData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message || 'Operação realizada com sucesso!');
                    window.location.href = '/meus-negocios'; // Redireciona de volta para a página de transações
                } else {
                    alert(`Erro: ${data.message || 'Ocorreu um erro ao salvar o beat.'}`);
                    console.error('Erro do servidor:', data);
                }
            } catch (error) {
                console.error('Erro de conexão:', error);
                alert('Erro de conexão. Não foi possível salvar o beat.');
            }
        });
    }
});