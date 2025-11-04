document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica para remover itens do carrinho
    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const itemId = button.dataset.id;
            
            // Usamos confirm/alert temporariamente
            if (!confirm("Tem certeza que deseja remover este beat do carrinho?")) return; 

            try {
                // Chama a rota DELETE /carrinho/remover/:id no backend
                const response = await fetch(`/carrinho/remover/${itemId}`, { method: 'DELETE' });
                
                if (response.ok) {
                    alert('Item removido com sucesso.'); 
                    window.location.reload(); // Recarrega a página para atualizar o total e o layout
                } else {
                    const result = await response.json();
                    alert(result.message || 'Erro ao remover item.');
                }
            } catch (error) {
                console.error('Erro de conexão com o servidor:', error);
                alert('Erro de conexão com o servidor.');
            }
        });
    });

    // NOTA: O botão "Ir para Checkout" é um link <a> simples no cart.ejs
    // e não precisa de JavaScript neste ficheiro.
});