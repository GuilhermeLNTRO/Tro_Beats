document.addEventListener('DOMContentLoaded', () => {
    console.log('Script do Carrinho TROBeats carregado!');

    const cartTable = document.querySelector('.cart-table');

    if (cartTable) {
        // Delegação de eventos para botões de quantidade e remover
        cartTable.addEventListener('click', (event) => {
            const target = event.target;
            const row = target.closest('tr');
            const itemId = row.dataset.itemId; // Supondo que você tenha data-item-id no <tr>
            const quantityInput = row.querySelector('.quantity-input');
            const subtotalCell = row.querySelector('.subtotal');

            if (target.classList.contains('btn-increase')) {
                quantityInput.value = parseInt(quantityInput.value) + 1;
                updateSubtotal(row, quantityInput.value);
                updateTotal();
                // Aqui você faria uma chamada fetch para atualizar a quantidade no backend
                // fetch(`/api/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity: quantityInput.value }) });
            } else if (target.classList.contains('btn-decrease')) {
                let newQuantity = parseInt(quantityInput.value) - 1;
                if (newQuantity >= 1) {
                    quantityInput.value = newQuantity;
                    updateSubtotal(row, newQuantity);
                    updateTotal();
                    // Aqui você faria uma chamada fetch para atualizar a quantidade no backend
                    // fetch(`/api/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity: newQuantity }) });
                }
            } else if (target.classList.contains('btn-remove')) {
                row.remove();
                updateTotal();
                // Aqui você faria uma chamada fetch para remover o item do carrinho no backend
                // fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
            }
        });

        // Event listener para mudanças diretas no input de quantidade
        cartTable.addEventListener('change', (event) => {
            if (event.target.classList.contains('quantity-input')) {
                const row = event.target.closest('tr');
                const quantity = parseInt(event.target.value);
                if (quantity >= 1) {
                     updateSubtotal(row, quantity);
                     updateTotal();
                     // Aqui você faria uma chamada fetch para atualizar a quantidade no backend
                     // fetch(`/api/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity: quantity }) });
                } else {
                    event.target.value = 1; // Garante que a quantidade nunca seja menor que 1
                    updateSubtotal(row, 1);
                    updateTotal();
                }
            }
        });

        // Função para atualizar o subtotal de um item
        function updateSubtotal(row, quantity) {
        const price = parseFloat(row.querySelector('td:nth-child(2)').textContent.slice(1)); // Remove o '$'
        const subtotal = price * quantity;
        row.querySelector('.subtotal').textContent = `$${subtotal.toFixed(2)}`;
        }
        // Função para atualizar o total geral do carrinho
        function updateTotal() {
            let total = 0;
            document.querySelectorAll('.cart-table tbody tr').forEach(row => {
                total += parseFloat(row.querySelector('.subtotal').textContent.slice(1));
            });
            document.querySelector('.total-price').textContent = `$${total.toFixed(2)}`;
        }

        // Chamada inicial para calcular o total ao carregar a página
        updateTotal();
    }
});