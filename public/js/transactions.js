document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const beatsForSaleTable = document.querySelector('#beats-a-venda .transactions-table tbody'); // Tabela de beats à venda

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Lógica para Ações de Beats (Editar/Excluir) ---
    if (beatsForSaleTable) {
        beatsForSaleTable.addEventListener('click', async (event) => {
            const target = event.target;
            const row = target.closest('tr'); // Pega a linha da tabela pai
            if (!row) return; // Se não encontrou a linha, sai

            const beatId = row.dataset.beatId; // ID do beat da linha

            if (target.closest('.edit-beat-btn')) {
                // Ação de Editar
                // Em um cenário real, você redirecionaria para uma página de edição
                // ou abriria um modal com os dados do beat.
                alert(`Funcionalidade de Editar Beat (ID: ${beatId}) - a ser implementada.`);
                // Exemplo de redirecionamento:
                window.location.href = `/vender-beat/editar/${beatId}`; // Nova rota para edição
            } else if (target.closest('.delete-beat-btn')) {
                // Ação de Excluir
                if (confirm('Tem certeza que deseja excluir este beat? Esta ação é irreversível!')) {
                    try {
                        const response = await fetch(`/api/beats/${beatId}`, { // Rota DELETE para o backend
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                                // Adicione tokens de autenticação se necessário
                            }
                        });

                        const data = await response.json();

                        if (response.ok) {
                            row.remove(); // Remove a linha da tabela no frontend
                            alert(data.message || 'Beat excluído com sucesso!');
                            // Opcional: Recarregar a lista ou verificar se a tabela ficou vazia
                            // Você pode precisar de uma função para atualizar os contadores ou mensagens de "nenhum beat"
                            const remainingBeats = beatsForSaleTable.querySelectorAll('tr[data-beat-id]').length;
                            if (remainingBeats === 0) {
                                // Se não houver mais beats, pode mostrar a mensagem de vazio
                                window.location.reload(); // Recarrega a página para mostrar "Você ainda não tem nenhum beat à venda."
                            }
                        } else {
                            alert(`Erro ao excluir beat: ${data.message || 'Ocorreu um erro.'}`);
                            console.error('Erro na exclusão do beat:', data);
                        }
                    } catch (error) {
                        console.error('Erro de conexão ao excluir beat:', error);
                        alert('Erro de conexão. Não foi possível excluir o beat.');
                    }
                }
            }
        });
    }

    // Ação para o botão "Adicionar Novo Beat"
    const addNewBeatButton = document.querySelector('.add-beat-btn');
    if (addNewBeatButton) {
        // A ação já é um link HTML, mas podemos adicionar um listener para efeitos ou analytics.
        
    }
});